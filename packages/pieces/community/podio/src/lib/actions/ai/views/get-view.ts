import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetViewOutputSchema } from '../../../output-schemas';

export const getViewAction = createAction({
  auth: podioAuth,
  name: 'podio_get_view',
  outputSchema: podioGetViewOutputSchema,
  displayName: 'Get View',
  description: 'Gets the definition of a view: its filters, sorting, field settings and grouping.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the definition of one view of a Podio app: filters, sorting, field settings and grouping. Takes a view id from List Views or Create View, the name of a standard view, or "last" for the view the user used last. The app id comes from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app that has the view.' }),
    viewIdOrName: podioAiProps.text({
      required: true,
      displayName: 'View ID or Name',
      description: 'A view id from List Views, the name of a standard view, or "last" for the last used view.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/view/app/${propsValue.appId}/${propsValue.viewIdOrName}` });
  },
});
