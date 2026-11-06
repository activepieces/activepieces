import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListAppsOutputSchema } from '../../../output-schemas';

export const listAppsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_apps',
  outputSchema: podioListAppsOutputSchema,
  displayName: 'List Apps',
  description: 'Lists or searches the apps the user can access, across all workspaces.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio apps the connected user can access across all workspaces, optionally matching a search text against app, item and workspace names. Returns app ids for every other app action. For the apps of one workspace use List Apps in Space. Podio returns 4 apps unless Limit is set.',
    idempotent: true,
  },
  props: {
    text: podioAiProps.text({ required: false, displayName: 'Search Text', description: 'Matches the app name, the item name of the app or the workspace name.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of apps to return. Podio defaults to 4.' }),
    order: podioAiProps.choice({
      required: false,
      displayName: 'Order',
      description: '"score" orders by how much the user uses the app, "name" by app name. Defaults to "score".',
      values: ['score', 'name'],
    }),
    targetSpaceId: podioAiProps.id({ required: false, displayName: 'Preferred Space ID', description: 'A workspace whose apps are preferred in the results.' }),
    excludeAppIds: podioAiProps.idList({ required: false, displayName: 'Exclude App IDs', description: 'App ids to leave out of the results.' }),
    excludeDemo: podioAiProps.bool({ required: false, displayName: 'Exclude Demo', description: '"true" leaves out apps from the demo workspace. Defaults to "false".' }),
    referenceableInOrg: podioAiProps.id({
      required: false,
      displayName: 'Referenceable in Organization ID',
      description: 'Only returns apps the user can reference in this organization, from List Organizations.',
    }),
    right: podioAiProps.text({ required: false, displayName: 'Right', description: 'A right the user must have on the returned apps, such as "view" or "update".' }),
  },
  async run({ auth, propsValue }) {
    const apps = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/app/',
      query: podioUtils.query({
        values: {
          text: propsValue.text,
          limit: propsValue.limit,
          order: propsValue.order,
          target_space_id: propsValue.targetSpaceId,
          exclude_app_ids: propsValue.excludeAppIds?.join(','),
          exclude_demo: podioUtils.toBool({ value: propsValue.excludeDemo }),
          referenceable_in_org: propsValue.referenceableInOrg,
          right: propsValue.right,
        },
      }),
    });
    return { apps, count: apps.length };
  },
});
