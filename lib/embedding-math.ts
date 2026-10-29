import { projectUnit, quantizeUnit } from "./projection.ts";
import type { SemanticScore } from "./semantic-config.ts";
import type { CapabilityCosine } from "./search.ts";

export type StoredEmbeddingIndex = {
  model: string;
  dtype: string;
  dim: number;
  ids: string[];
  matrix: string;
  documents: number;
  corpusHash: string;
};

export type EmbeddingIndex = {
  model: string;
  dtype: string;
  dim: number;
  ids: string[];
  matrix: Float32Array;
  documents: number;
  corpusHash: string;
};

export function floatToHalfBits(value: number): number {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, value, true);
  const bits = view.getUint32(0, true);
  const sign = (bits >>> 16) & 0x8000;
  const exponent = (bits >>> 23) & 0xff;
  const mantissa = bits & 0x7fffff;
  if (exponent === 255) return sign | 0x7c00 | (mantissa ? 0x200 : 0);
  // Smaller than the tiniest normal float16. Flushing these avoids a negative shift.
  if (exponent < 113) return sign;
  if (exponent > 142) return sign | 0x7c00;
  return sign | ((exponent - 112) << 10) | (mantissa >> 13);
}

function halfToFloat(half: number): number {
  const sign = (half & 0x8000) >> 15;
  const exponent = (half & 0x7c00) >> 10;
  const fraction = half & 0x03ff;
  if (exponent === 0) return (sign ? -1 : 1) * 2 ** -14 * (fraction / 1024);
  if (exponent === 31) return fraction ? Number.NaN : (sign ? -Infinity : Infinity);
  return (sign ? -1 : 1) * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeMatrix(matrix: Float32Array): string {
  const bytes = new Uint8Array(matrix.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < matrix.length; index += 1) view.setUint16(index * 2, floatToHalfBits(matrix[index]), true);
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function decodeStoredIndex(stored: StoredEmbeddingIndex): EmbeddingIndex {
  const bytes = base64ToBytes(stored.matrix);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const matrix = new Float32Array(stored.ids.length * stored.dim);
  for (let index = 0; index < matrix.length; index += 1) matrix[index] = halfToFloat(view.getUint16(index * 2, true));
  return {
    model: stored.model,
    dtype: stored.dtype,
    dim: stored.dim,
    ids: stored.ids,
    matrix,
    documents: stored.documents,
    corpusHash: stored.corpusHash,
  };
}

export type StoredCapabilityIndex = {
  model: string;
  dim: number;
  ids: string[];
  matrix: string;
};

export type CapabilityIndex = {
  model: string;
  dim: number;
  ids: string[];
  matrix: Int8Array;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function encodeInt8Matrix(matrix: Int8Array): string {
  return bytesToBase64(new Uint8Array(matrix.buffer, matrix.byteOffset, matrix.byteLength));
}

export function decodeCapabilityIndex(stored: StoredCapabilityIndex): CapabilityIndex {
  const bytes = base64ToBytes(stored.matrix);
  return {
    model: stored.model,
    dim: stored.dim,
    ids: stored.ids,
    matrix: Int8Array.from(bytes),
  };
}

/** Cosine of a full bge query vector against every stored capability. */
export function capabilityCosines(index: CapabilityIndex, vector: Float32Array): CapabilityCosine[] {
  const query = quantizeUnit(projectUnit(vector));
  const scores: CapabilityCosine[] = [];
  const { dim, ids, matrix } = index;
  let queryNorm = 0;
  for (const value of query) queryNorm += value * value;
  queryNorm = Math.sqrt(queryNorm) || 1;
  for (let row = 0; row < ids.length; row += 1) {
    let dot = 0;
    let docNorm = 0;
    const offset = row * dim;
    for (let column = 0; column < dim; column += 1) {
      const value = matrix[offset + column] ?? 0;
      dot += (query[column] ?? 0) * value;
      docNorm += value * value;
    }
    const cosine = dot / (queryNorm * (Math.sqrt(docNorm) || 1));
    scores.push({ key: ids[row] ?? "", cosine });
  }
  return scores;
}

function topMean(values: number[]): number {
  const ranked = values.sort((a, b) => b - a).slice(0, 3);
  return ranked.reduce((sum, value) => sum + value, 0) / ranked.length;
}

/**
 * Each concept is scored by the mean of its three closest seed texts.
 * The first stored row for a concept is its description, kept separate so one
 * overlapping sentence cannot outvote the job, and so a near-tie can prefer
 * the description that is actually closer.
 */
export function scoresForVector(index: EmbeddingIndex, vector: Float32Array): SemanticScore[] {
  const seeds = new Map<string, number[]>();
  const profile = new Map<string, number>();
  const { dim, ids, matrix } = index;
  for (let row = 0; row < ids.length; row += 1) {
    let dot = 0;
    const offset = row * dim;
    for (let column = 0; column < dim; column += 1) dot += matrix[offset + column] * vector[column];
    const id = ids[row];
    if (!profile.has(id)) {
      profile.set(id, dot);
      continue;
    }
    const list = seeds.get(id);
    if (list) list.push(dot);
    else seeds.set(id, [dot]);
  }
  return [...profile.entries()]
    .map(([id, profileCosine]) => ({ id, cosine: topMean(seeds.get(id) ?? [profileCosine]), profile: profileCosine }))
    .sort((a, b) => b.cosine - a.cosine || b.profile - a.profile || a.id.localeCompare(b.id));
}
