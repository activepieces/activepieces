import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateAppOutputSchema } from '../../../output-schemas';

export const createAppAction = createAction({
  auth: podioAuth,
  name: 'podio_create_app',
  outputSchema: podioCreateAppOutputSchema,
  displayName: 'Create App',
  description: 'Creates a new app in a workspace, optionally with its fields.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Podio app in a workspace and returns its app_id; fields can be passed here or added later with Create App Field. The space id comes from List Organizations or Get Space, an icon from Get Icon Suggestions.',
    idempotent: false,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace to create the app in.' }),
    name: podioAiProps.text({ required: true, displayName: 'Name', description: 'The name of the app, such as "Projects".' }),
    itemName: podioAiProps.text({ required: true, displayName: 'Item Name', description: 'The name of one item in the app, such as "Project".' }),
    type: podioAiProps.choice({
      required: false,
      displayName: 'Type',
      description: 'The app type: "standard", "meeting" or "contact". Defaults to "standard".',
      values: ['standard', 'meeting', 'contact'],
    }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'The description of the app.' }),
    usage: podioAiProps.longText({ required: false, displayName: 'Usage', description: 'Instructions on how the app should be used.' }),
    icon: podioAiProps.text({ required: true, displayName: 'Icon', description: 'The icon of the app, such as "141.png", from Get Icon Suggestions. Podio requires one.' }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'An id from an external system to store on the app.' }),
    config: podioAiProps.json({
      required: false,
      displayName: 'Additional Config',
      description: 'Other app config keys as a JSON object, such as {"allow_edit": true, "allow_comments": true, "fivestar": true, "tasks": [{"text": "Review", "responsible": ["123"]}]}. The fields above override the same keys here.',
    }),
    fields: podioAiProps.json({
      required: false,
      displayName: 'Fields',
      description: 'The fields as a JSON array, each {"type": "text", "config": {"label": "Title", "required": true, "settings": {}}}. Types include text, number, date, category, app, contact, money, progress, location, duration, email, phone, link, image and calculation.',
    }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/app/',
      query: podioUtils.query({ values: { silent: podioUtils.toBool({ value: propsValue.silent }) } }),
      body: podioUtils.body({
        values: {
          space_id: Number(propsValue.spaceId),
          config: {
            ...propsValue.config,
            ...podioUtils.body({
              values: {
                name: propsValue.name,
                item_name: propsValue.itemName,
                type: propsValue.type,
                description: propsValue.description,
                usage: propsValue.usage,
                icon: propsValue.icon,
                external_id: propsValue.externalId,
              },
            }),
          },
          fields: propsValue.fields,
        },
      }),
    });
  },
});
