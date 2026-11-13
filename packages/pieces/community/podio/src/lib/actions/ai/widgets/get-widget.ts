import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCloneWidgetOutputSchema } from '../../../output-schemas';

export const getWidgetAction = createAction({
  auth: podioAuth,
  name: 'podio_get_widget',
  outputSchema: podioCloneWidgetOutputSchema,
  displayName: 'Get Widget',
  description: 'Gets one widget with its title and configuration.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio widget: its type, title, config, reference and the rights the user has on it, without its display data (List Widgets has that). The widget id comes from List Widgets.',
    idempotent: true,
  },
  props: {
    widgetId: podioAiProps.id({ required: true, displayName: 'Widget ID', description: 'The id of the widget, from List Widgets.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/widget/${propsValue.widgetId}` });
  },
});
