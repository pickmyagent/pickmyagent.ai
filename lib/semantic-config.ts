/** Cosine of the query against one concept. */
export type SemanticScore = { id: string; cosine: number; profile: number };

export const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBEDDING_DTYPE = "q8" as const;
export const EMBEDDING_POOLING = "cls" as const;
/** bge encodes a search query with this prefix. Stored job texts do not. */
export const EMBEDDING_QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

/**
 * One global calibration for meaning match.
 * Floors sit above off-domain queries (wedding, dog training, cookbook, garage,
 * cake, a vague "deals" mention) and are not fit to individual held-out lines.
 * A query that shares a domain word with the job uses the lower floor.
 * A query with no domain word must clear the higher floor.
 * A broad catch-all job must clear the highest floor.
 * A near-tie can still win when the job description itself is clearly closer.
 */
export const SEMANTIC_FLOOR = 0.56;
export const SEMANTIC_UNANCHORED_FLOOR = 0.62;
export const SEMANTIC_BROAD_FLOOR = 0.71;
/** An anchored job this close to the leader can replace a rival with no job signal. */
export const SEMANTIC_SIGNAL_WINDOW = 0.05;
export const SEMANTIC_MARGIN = 0.02;
export const SEMANTIC_PROFILE_MARGIN = 0.04;
/** A confident lexicon hit yields only when meaning is this far ahead of it. */
export const SEMANTIC_CONFIDENT_GAP = 0.1;
export const SEMANTIC_DISAGREE_GAP = 0.04;
