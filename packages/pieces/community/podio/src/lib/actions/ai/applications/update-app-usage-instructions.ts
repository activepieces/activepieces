import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateAppUsageInstructionsAction = createAction({
  auth: podioAuth,
  name: 'podio_update_app_usage_instructions',
  displayName: 'Update App Usage Instructions',
  description: 'Replaces the usage instructions of an app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the usage instructions of a Podio app (how members should use it) and changes nothing else; to change several settings at once use Update App. The app id comes from List Apps, List Apps in Space or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app.' }),
    usage: podioAiProps.longText({ required: true, displayName: 'Usage Instructions', description: 'The new usage instructions of the app.' }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/app/${propsValue.appId}/usage`,
      query: podioUtils.query({ values: { silent: podioUtils.toBool({ value: propsValue.silent }) } }),
      body: { usage: propsValue.usage },
    });
  },
});
