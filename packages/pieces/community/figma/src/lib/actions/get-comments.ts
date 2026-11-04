import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const getCommentsAction = createAction({
  auth: figmaAuth,
  name: 'get_comments',
  classification: 'SEARCH',
  displayName: 'Get File Comments',
  description: 'Lists the comments on a Figma file, optionally only unresolved ones or ones after a date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all comments on a Figma file (file URL or key) under response_body.comments; each has id, message, parent_id (empty for top-level), user, created_at, resolved_at and client_meta.node_id. Filters: Unresolved Only, Created After. Use the id with Post File Comment (reply), Delete Comment or the reaction actions. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.getComments,
  props: {
    file_key: figmaProps.fileKey(),
    as_md: Property.Checkbox({
      displayName: 'Messages as Markdown',
      description: 'Return comment messages as Markdown instead of plain text.',
      required: false,
      defaultValue: false,
    }),
    unresolved_only: Property.Checkbox({
      displayName: 'Unresolved Only',
      description: 'Skip comments that were resolved.',
      required: false,
      defaultValue: false,
    }),
    since: Property.DateTime({
      displayName: 'Created After',
      description: 'Only return comments created after this date and time.',
      required: false,
    }),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const since = parseSince(context.propsValue.since);
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}/comments`,
      query: { as_md: context.propsValue.as_md === true ? true : undefined },
      scope: 'file_comments:read',
      tier: 2,
      operation: 'get the file comments',
    });
    const unresolvedOnly = context.propsValue.unresolved_only === true;
    if (!unresolvedOnly && since === undefined) {
      return { success: true, request_body: undefined, response_body: response.body };
    }
    const body = figmaClient.isRecord(response.body) ? response.body : {};
    const comments = (Array.isArray(body['comments']) ? body['comments'] : []).filter((comment) => {
      if (!figmaClient.isRecord(comment)) return false;
      if (unresolvedOnly && typeof comment['resolved_at'] === 'string' && comment['resolved_at'] !== '') return false;
      if (since !== undefined) {
        const created = Date.parse(String(comment['created_at'] ?? ''));
        if (!Number.isFinite(created) || created <= since) return false;
      }
      return true;
    });
    return { success: true, request_body: undefined, response_body: { ...body, comments } };
  },
});

function parseSince(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const time = Date.parse(String(value));
  if (!Number.isFinite(time)) throw new Error('Created After must be a valid date and time.');
  return time;
}
