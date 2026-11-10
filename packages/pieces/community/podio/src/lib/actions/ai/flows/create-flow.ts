import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateFlowOutputSchema } from '../../../output-schemas';

export const createFlowAction = createAction({
  auth: podioAuth,
  name: 'podio_create_flow',
  outputSchema: podioCreateFlowOutputSchema,
  displayName: 'Create Flow',
  description: 'Creates a flow on an app that runs effects when an item is created or updated.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Podio flow on an app: when an item is created ("item.create") or one of the given fields is updated ("item.update"), Podio runs the listed effects. Field IDs are required for "item.update" and not allowed for "item.create". Find effect attribute ids with Get Flow Effect Attributes and usable variables with Get Flow Attributes; the app id comes from List Apps or Get App.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app the flow runs on, from List Apps or Get App.' }),
    name: podioAiProps.text({ required: true, displayName: 'Name', description: 'The name of the flow.' }),
    type: podioAiProps.choice({
      required: true,
      displayName: 'Type',
      description: 'What starts the flow: "item.create" when an item is created, "item.update" when one of the Field IDs is updated.',
      values: ['item.create', 'item.update'],
    }),
    fieldIds: podioAiProps.idList({
      required: false,
      displayName: 'Field IDs',
      description: 'Only for Type "item.update": the ids of the app fields whose update starts the flow, from Get App.',
    }),
    effects: podioAiProps.idList({
      required: true,
      displayName: 'Effects',
      description:
        'The effects to run, each an object {"type": "<effect type>", "attributes": [{"attribute_id": "<attribute id>", "value": "<text or expression>"}]}. Attribute ids come from Get Flow Effect Attributes.',
    }),
  },
  async run({ auth, propsValue }) {
    const fieldIds = propsValue.fieldIds ?? [];
    if (propsValue.type === 'item.update' && fieldIds.length === 0) {
      throw new Error('Field IDs is required when Type is "item.update".');
    }
    if (propsValue.type !== 'item.update' && fieldIds.length > 0) {
      throw new Error('Field IDs only applies when Type is "item.update".');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/flow/app/${propsValue.appId}/`,
      body: {
        name: propsValue.name,
        type: propsValue.type,
        config: propsValue.type === 'item.update' ? { field_ids: fieldIds.map((id) => Number(id)) } : {},
        effects: propsValue.effects,
      },
    });
  },
});
