export const config = {
  pieces: {
    relevanceThreshold: 0.35,
  },
} as const;

export type Config = typeof config; 