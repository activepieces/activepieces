import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetAppValuesOutputSchema } from '../../../output-schemas';

export const getAppValuesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_values',
  outputSchema: podioGetAppValuesOutputSchema,
  displayName: 'Get App Values',
  description: 'Gets the distinct creators, tags and field values used by items in an app.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Lists the distinct values used across an app's items: creators, creation clients, tags, and the options or min/max of its state, member, app, contact, number, progress, calculation and question fields. Podio marks this endpoint deprecated. The app id comes from List Apps in Space or Get App.",
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/app/${propsValue.appId}/values` });
  },
});
