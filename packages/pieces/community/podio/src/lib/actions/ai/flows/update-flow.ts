import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateFlowOutputSchema } from '../../../output-schemas';

export const updateFlowAction = createAction({
  auth: podioAuth,
  name: 'podio_update_flow',
  outputSchema: podioCreateFlowOutputSchema,
  displayName: 'Update Flow',
  description: 'Updates the name, trigger fields and effects of a flow.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a Podio flow: its name, the fields that start an "item.update" flow, and its effects; the flow type cannot change. Pass every effect the flow should keep, existing ones with their effect_id from Get Flow. The flow id comes from List Flows.',
    idempotent: true,
  },
  props: {
    flowId: podioAiProps.id({ required: true, displayName: 'Flow ID', description: 'The id of the flow, from List Flows.' }),
    name: podioAiProps.text({ required: true, displayName: 'Name', description: 'The name of the flow.' }),
    fieldIds: podioAiProps.idList({
      required: false,
      displayName: 'Field IDs',
      description: 'Only for an "item.update" flow: the ids of the app fields whose update starts the flow, from Get App. Leave empty to keep them.',
    }),
    effects: podioAiProps.idList({
      required: true,
      displayName: 'Effects',
      description:
        'The effects, each an object {"effect_id": <id of an existing effect, omit for a new one>, "type": "<effect type>", "attributes": [{"attribute_id": "<attribute id>", "value": "<text or expression>"}]}. Attribute ids come from Get Flow Effect Attributes.',
    }),
  },
  async run({ auth, propsValue }) {
    const fieldIds = propsValue.fieldIds ?? [];
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/flow/${propsValue.flowId}`,
      body: podioUtils.body({
        values: {
          name: propsValue.name,
          config: fieldIds.length > 0 ? { field_ids: fieldIds.map((id) => Number(id)) } : undefined,
          effects: propsValue.effects,
        },
      }),
    });
  },
});
