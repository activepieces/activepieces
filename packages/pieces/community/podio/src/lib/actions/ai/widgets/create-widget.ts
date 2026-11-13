import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCloneWidgetOutputSchema } from '../../../output-schemas';

export const createWidgetAction = createAction({
  auth: podioAuth,
  name: 'podio_create_widget',
  outputSchema: podioCloneWidgetOutputSchema,
  displayName: 'Create Widget',
  description: 'Creates a widget on an organization, space, app or user dashboard.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Podio widget on an organization, space, app or user and returns its widget id. Not every widget type fits every reference type (an "apps" widget only fits a user); the config depends on the widget type.',
    idempotent: false,
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
    type: podioAiProps.text({ required: true, displayName: 'Widget Type', description: 'The type of widget, such as "text", "link", "image" or "apps".' }),
    title: podioAiProps.text({ required: true, displayName: 'Title', description: 'The title of the widget.' }),
    config: podioAiProps.json({ required: true, displayName: 'Config', description: 'The widget configuration, which depends on the widget type.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/widget/${propsValue.refType}/${propsValue.refId}/`,
      body: { type: propsValue.type, title: propsValue.title, config: propsValue.config },
    });
  },
});
