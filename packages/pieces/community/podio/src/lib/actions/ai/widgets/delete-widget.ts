import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteWidgetAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_widget',
  displayName: 'Delete Widget',
  description: 'Permanently deletes a widget.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a Podio widget; it cannot be restored. The widget id comes from List Widgets.',
    idempotent: false,
  },
  props: {
    widgetId: podioAiProps.id({ required: true, displayName: 'Widget ID', description: 'The id of the widget, from List Widgets.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/widget/${propsValue.widgetId}` });
  },
});
