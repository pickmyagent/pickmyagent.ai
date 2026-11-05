/** Fixed Gaussian projection from bge-small's 384 dimensions down to 128. */

export const CAPABILITY_DIM = 128;
const INPUT_DIM = 384;
const SEED = 20261029;

let matrix: Float32Array | null = null;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function projectionMatrix(): Float32Array {
  if (matrix) return matrix;
  const random = mulberry32(SEED);
  const data = new Float32Array(CAPABILITY_DIM * INPUT_DIM);
  for (let column = 0; column < CAPABILITY_DIM; column += 1) {
    let norm = 0;
    const values = new Float32Array(INPUT_DIM);
    for (let row = 0; row < INPUT_DIM; row += 1) {
      const u1 = Math.max(random(), 1e-9);
      const u2 = random();
      const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      values[row] = gaussian;
      norm += gaussian * gaussian;
    }
    norm = Math.sqrt(norm) || 1;
    for (let row = 0; row < INPUT_DIM; row += 1) data[column * INPUT_DIM + row] = (values[row] ?? 0) / norm;
  }
  matrix = data;
  return data;
}

/** Project a unit bge vector and re-normalize. */
export function projectUnit(vector: Float32Array): Float32Array {
  const weights = projectionMatrix();
  const out = new Float32Array(CAPABILITY_DIM);
  const width = Math.min(vector.length, INPUT_DIM);
  for (let column = 0; column < CAPABILITY_DIM; column += 1) {
    let sum = 0;
    const offset = column * INPUT_DIM;
    for (let row = 0; row < width; row += 1) sum += (weights[offset + row] ?? 0) * (vector[row] ?? 0);
    out[column] = sum;
  }
  let norm = 0;
  for (const value of out) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  for (let index = 0; index < out.length; index += 1) out[index] = (out[index] ?? 0) / norm;
  return out;
}

export function quantizeUnit(unit: Float32Array): Int8Array {
  const out = new Int8Array(unit.length);
  for (let index = 0; index < unit.length; index += 1) {
    const value = Math.max(-1, Math.min(1, unit[index] ?? 0));
    out[index] = Math.max(-127, Math.min(127, Math.round(value * 127)));
  }
  return out;
}
