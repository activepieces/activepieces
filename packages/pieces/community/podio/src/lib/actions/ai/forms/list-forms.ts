import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListFormsOutputSchema } from '../../../output-schemas';

export const listFormsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_forms',
  outputSchema: podioListFormsOutputSchema,
  displayName: 'List Forms',
  description: 'Lists the web forms of an app.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the web forms of one Podio app with their settings, domains and fields; this is where form ids come from. The app id comes from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps or Get App.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/form/app/${propsValue.appId}/` });
    return { forms: body, count: body.length };
  },
});
