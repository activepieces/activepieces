import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioGetAppOutputSchema } from '../../../output-schemas';

export const getAppAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app',
  outputSchema: podioGetAppOutputSchema,
  displayName: 'Get App',
  description: 'Gets the latest definition of an app, with its configuration and fields.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the latest definition of one Podio app: its configuration, owner, rights and fields, including each field id and external id needed to create or filter items. The app id comes from List Apps, List Apps in Space or Get App by Labels.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app.' }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.getApp({ auth, appId: propsValue.appId });
  },
});
