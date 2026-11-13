import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetFlowEffectAttributesOutputSchema } from '../../../output-schemas';

export const getFlowEffectAttributesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_flow_effect_attributes',
  outputSchema: podioGetFlowEffectAttributesOutputSchema,
  displayName: 'Get Flow Effect Attributes',
  description: 'Lists the attributes an effect of a given type takes in a flow on an app.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the attributes (id, type, label) that an effect type takes in a flow on an app, so Create Flow and Update Flow can fill them. Use Get Flow Attributes for the variables an attribute can use. The app id comes from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app the flow is on, from List Apps or Get App.' }),
    effectType: podioAiProps.text({ required: true, displayName: 'Effect Type', description: 'The type of the effect, as used in a flow effect.' }),
    effectConfig: podioAiProps.json({ required: false, displayName: 'Effect Config', description: 'The configuration of the effect, if the effect type has one.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.POST,
      path: `/flow/app/${propsValue.appId}/effect/attributes/`,
      body: podioUtils.body({ values: { type: propsValue.effectType, config: propsValue.effectConfig } }),
    });
    return { attributes: body, count: body.length };
  },
});
