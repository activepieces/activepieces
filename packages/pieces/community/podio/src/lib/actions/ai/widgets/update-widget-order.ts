import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const updateWidgetOrderAction = createAction({
  auth: podioAuth,
  name: 'podio_update_widget_order',
  displayName: 'Update Widget Order',
  description: 'Reorders the widgets on an organization, space, app or user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the display order of the Podio widgets on an organization, space, app or user. Pass every widget id on the reference, from List Widgets, in the new order.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.choice({
      required: true,
      displayName: 'Reference Type',
      description: 'Where the widgets live: "org", "space", "app" or "user".',
      values: ['org', 'space', 'app', 'user'],
    }),
    refId: podioAiProps.id({
      required: true,
      displayName: 'Reference ID',
      description: 'The id of the organization, space, app or user, from List Organizations, Get Space, List Apps or Get User.',
    }),
    widgetIds: podioAiProps.idList({ required: true, displayName: 'Widget IDs', description: 'All widget ids on the reference, from List Widgets, in the new order.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/widget/${propsValue.refType}/${propsValue.refId}/order`,
      body: propsValue.widgetIds.map((id) => Number(id)),
    });
  },
});
