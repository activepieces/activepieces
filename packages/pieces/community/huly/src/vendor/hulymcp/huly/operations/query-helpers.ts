import type { Doc, FindOptions, Lookup } from "@hcengineering/core"

/**
 * Escape SQL LIKE wildcard characters in a string.
 * Prevents user input from being interpreted as wildcards.
 */
export const escapeLikeWildcards = (input: string): string =>
  input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")

/**
 * Add lookup to FindOptions for relationship joins.
 * Lookups allow fetching related documents in a single query,
 * avoiding N+1 query problems.
 */
export const withLookup = <T extends Doc>(
  options: FindOptions<T> | undefined,
  lookups: Lookup<T>
): FindOptions<T> => ({
  ...options,
  lookup: {
    ...options?.lookup,
    ...lookups
  }
})
