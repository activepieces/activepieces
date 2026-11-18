import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioInstallAppOutputSchema } from '../../../output-schemas';

export const installAppAction = createAction({
  auth: podioAuth,
  name: 'podio_install_app',
  outputSchema: podioInstallAppOutputSchema,
  displayName: 'Install App',
  description: 'Installs a copy of an app into a workspace.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Installs a copy of an existing Podio app into a workspace and returns the new app_id; each call creates another copy. Without Features, everything except the items is copied. The app id comes from List Apps or Get App, the space id from List Organizations or Get Space.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to copy.' }),
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace to install the copy in.' }),
    features: podioAiProps.idList({
      required: false,
      displayName: 'Features',
      description: 'The features to copy, out of filters, widgets, integration, forms, items, flows and votings. Defaults to all except items.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/app/${propsValue.appId}/install`,
      query: podioUtils.query({ values: { features: propsValue.features?.join(',') } }),
      body: { space_id: Number(propsValue.spaceId) },
    });
  },
});
