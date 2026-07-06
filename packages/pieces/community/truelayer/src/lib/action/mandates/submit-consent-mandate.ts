import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const submitConsentMandate = createAction({
  auth: trueLayerCommon.auth,
  name: 'submit-consent-mandate',
  displayName: 'Submit consent',
  description: 'Submit the consent given by the user. This API can be called using either the mandate_token associated with the mandate or a backend bearer token.',
  audience: 'both',
  aiMetadata: { description: 'Submit the user\'s consent action within a mandate authorization flow, identified by the mandate ID. Use after Start Authorization Flow when the flow requires a consent step; this advances mandate state and is not idempotent.', idempotent: false },
  props: {
    id: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'The ID of the mandate for which consent is being submitted.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/mandates/${ctx.propsValue.id}/authorization-flow/actions/consent`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: ctx.propsValue,
    })

    return response.body;
  },
});
