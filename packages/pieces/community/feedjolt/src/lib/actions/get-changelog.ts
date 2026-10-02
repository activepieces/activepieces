import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const getChangelog = createAction({
  auth: feedjoltAuth,
  name: 'get_changelog',
  classification: 'SEARCH',
  displayName: 'Get Changelog',
  description: 'List published changelog entries for a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'List published changelog entries for a workspace. Use to sync product updates. Limit is 1–100 (default 20). Safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceSlug: feedjoltCommon.workspaceDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of changelog entries to return (1–100). Defaults to 20.',
      required: false,
      defaultValue: 20,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),
  },
  async run(context) {
    const pageSize = Math.min(100, Math.max(1, context.propsValue.limit ?? 20));
    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspaces/${encodeURIComponent(context.propsValue.workspaceSlug)}/changelog`,
      queryParams: { page_size: pageSize },
    });
    return feedjoltCommon
      .parseList(response.body, ['entries', 'data', 'items'])
      .map((entry) => feedjoltCommon.flattenChangelogEntry(entry));
  },
});
