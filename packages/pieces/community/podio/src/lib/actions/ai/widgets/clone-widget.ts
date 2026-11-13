import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCloneWidgetOutputSchema } from '../../../output-schemas';

export const cloneWidgetAction = createAction({
  auth: podioAuth,
  name: 'podio_clone_widget',
  outputSchema: podioCloneWidgetOutputSchema,
  displayName: 'Clone Widget',
  description: 'Copies a widget to a user or space dashboard.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a Podio widget to the bottom of a user or space dashboard and returns the new widget id. The widget id comes from List Widgets; the space id from Get Space, the user id from Get User.',
    idempotent: false,
  },
  props: {
    widgetId: podioAiProps.id({ required: true, displayName: 'Widget ID', description: 'The id of the widget to copy, from List Widgets.' }),
    targetType: podioAiProps.choice({
      required: true,
      displayName: 'Target Type',
      description: 'Where to place the copy: "user" or "space".',
      values: ['user', 'space'],
    }),
    targetId: podioAiProps.id({ required: true, displayName: 'Target ID', description: 'The id of the user or space to place the copy on.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/widget/${propsValue.widgetId}/clone`,
      body: { type: propsValue.targetType, id: Number(propsValue.targetId) },
    });
  },
});
