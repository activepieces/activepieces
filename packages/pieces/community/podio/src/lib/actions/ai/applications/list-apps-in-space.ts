import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListAppsInSpaceOutputSchema } from '../../../output-schemas';

export const listAppsInSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_list_apps_in_space',
  outputSchema: podioListAppsInSpaceOutputSchema,
  displayName: 'List Apps in Space',
  description: 'Lists the apps in a workspace, in their navigator order.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all visible apps in one Podio workspace, in the custom navigator order or else by name, with their ids, status and basic configuration. Inactive apps are left out unless Include Inactive is "true". The space id comes from List Organizations or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace.' }),
    includeInactive: podioAiProps.bool({ required: false, displayName: 'Include Inactive', description: '"true" also returns deactivated apps. Defaults to "false".' }),
  },
  async run({ auth, propsValue }) {
    const apps = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/app/space/${propsValue.spaceId}/`,
      query: podioUtils.query({ values: { include_inactive: podioUtils.toBool({ value: propsValue.includeInactive }) } }),
    });
    return { apps, count: apps.length };
  },
});
