import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const getRoadmap = createAction({
  auth: feedjoltAuth,
  name: 'get_roadmap',
  classification: 'READ',
  displayName: 'Get Roadmap',
  description: 'Get the public roadmap for a workspace as one row per post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the public roadmap for a workspace and return one flattened row per post (status plus post fields). Empty status columns still return a row with no post. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceSlug: feedjoltCommon.workspaceDropdown,
  },
  async run(context) {
    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspaces/${encodeURIComponent(context.propsValue.workspaceSlug)}/roadmap`,
    });
    if (!feedjoltCommon.isRecord(response.body)) {
      throw new Error('Feedjolt returned an unexpected roadmap payload.');
    }
    return feedjoltCommon.flattenRoadmapRows(response.body);
  },
});
