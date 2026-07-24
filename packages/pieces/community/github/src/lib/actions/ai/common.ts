import { Property } from '@activepieces/pieces-framework';

/**
 * Shared flat props + error mapping for the agent (audience:'ai') GitHub atomics.
 * Agents cannot drive Property.Dropdown / DynamicProperties, so every atomic takes
 * plain owner/repo ShortText (resolve via List My Repositories / Search Repositories /
 * Get Authenticated User) instead of githubCommon.repositoryDropdown.
 */
export const ownerProp = Property.ShortText({
  displayName: 'Owner',
  description:
    'Repository owner login (user or org). Resolve via List My Repositories, Search Repositories, or Get Authenticated User.',
  required: true,
});

export const repoProp = Property.ShortText({
  displayName: 'Repository',
  description: 'Repository name (without the owner prefix).',
  required: true,
});

/**
 * Maps a github httpClient error to a friendly message. Returns the thrown Error.
 * `resource` is a human label for the 404 (e.g. "Repository owner/repo").
 */
export function githubError(error: any, resource: string): Error {
  const status = error?.response?.status;
  if (status === 404)
    return new Error(`${resource} not found, or you lack access.`);
  if (status === 403)
    return new Error(
      `Permission denied (status 403) — check write permission / token scope for ${resource}.`
    );
  if (status === 429)
    return new Error('GitHub rate limit hit (status 429). Retry later.');
  if (status === 422)
    return new Error(
      `Unprocessable request (status 422) for ${resource}: ${
        error?.response?.body?.message ?? 'validation failed'
      }.`
    );
  return error instanceof Error ? error : new Error(String(error));
}
