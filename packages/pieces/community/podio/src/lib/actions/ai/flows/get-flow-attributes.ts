import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetFlowAttributesOutputSchema } from '../../../output-schemas';

export const getFlowAttributesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_flow_attributes',
  outputSchema: podioGetFlowAttributesOutputSchema,
  displayName: 'Get Flow Attributes',
  description: 'Lists the attributes that can be used as variables in one effect attribute of a flow.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the attributes (id, type, label, required, nullable) a flow on an app can use as variables for one effect attribute, given the cause and the effect, before Create Flow or Update Flow. Effect attribute ids come from Get Flow Effect Attributes; the app id from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app the flow is on, from List Apps or Get App.' }),
    causeType: podioAiProps.choice({
      required: true,
      displayName: 'Cause Type',
      description: 'What starts the flow: "item.create" or "item.update".',
      values: ['item.create', 'item.update'],
    }),
    causeConfig: podioAiProps.json({
      required: false,
      displayName: 'Cause Config',
      description: 'The configuration of the cause, such as {"field_ids": [123]} for "item.update".',
    }),
    effectType: podioAiProps.text({ required: true, displayName: 'Effect Type', description: 'The type of the effect.' }),
    effectConfig: podioAiProps.json({ required: false, displayName: 'Effect Config', description: 'The configuration of the effect, if the effect type has one.' }),
    attributeId: podioAiProps.text({
      required: true,
      displayName: 'Attribute ID',
      description: 'The id of the effect attribute to get variables for, from Get Flow Effect Attributes.',
    }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.POST,
      path: `/flow/app/${propsValue.appId}/attributes/`,
      body: {
        cause: podioUtils.body({ values: { type: propsValue.causeType, config: propsValue.causeConfig } }),
        effect: podioUtils.body({ values: { type: propsValue.effectType, config: propsValue.effectConfig, attribute_id: propsValue.attributeId } }),
      },
    });
    return { attributes: body, count: body.length };
  },
});
