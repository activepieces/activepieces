import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCloneWidgetOutputSchema } from '../../../output-schemas';

export const updateWidgetAction = createAction({
  auth: podioAuth,
  name: 'podio_update_widget',
  outputSchema: podioCloneWidgetOutputSchema,
  displayName: 'Update Widget',
  description: 'Sets the title and configuration of a widget.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the title and config of a Podio widget; both are sent, so read the current ones with Get Widget to change only one. The widget id comes from List Widgets.',
    idempotent: true,
  },
  props: {
    widgetId: podioAiProps.id({ required: true, displayName: 'Widget ID', description: 'The id of the widget, from List Widgets.' }),
    title: podioAiProps.text({ required: true, displayName: 'Title', description: 'The title of the widget.' }),
    config: podioAiProps.json({ required: true, displayName: 'Config', description: 'The widget configuration, which depends on the widget type.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/widget/${propsValue.widgetId}`,
      body: { title: propsValue.title, config: propsValue.config },
    });
  },
});
