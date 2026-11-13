import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetAppFeaturesOutputSchema } from '../../../output-schemas';

export const getAppFeaturesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_features',
  outputSchema: podioGetAppFeaturesOutputSchema,
  displayName: 'Get App Features',
  description: 'Gets the features (widgets, tasks, filters, forms, integration, items) that a set of apps includes.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns which features the given Podio apps include, out of widgets, tasks, filters, forms, integration and items, optionally adding those of their workspace. Use it to pick the features for Install App. The app ids come from List Apps or List Apps in Space.',
    idempotent: true,
  },
  props: {
    appIds: podioAiProps.idList({ required: true, displayName: 'App IDs', description: 'The ids of the apps to read the features of.' }),
    includeSpace: podioAiProps.bool({ required: false, displayName: 'Include Space', description: '"true" also includes the features of the workspace that holds the apps. Defaults to "false".' }),
  },
  async run({ auth, propsValue }) {
    const features = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/app/features/',
      query: podioUtils.query({
        values: { app_ids: propsValue.appIds.join(','), include_space: podioUtils.toBool({ value: propsValue.includeSpace }) },
      }),
    });
    return { features, count: features.length };
  },
});
