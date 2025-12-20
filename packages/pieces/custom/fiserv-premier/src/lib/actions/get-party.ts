import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fiservPremierAuth } from '../..';

export const getParty = createAction({
  name: 'get_party',
  auth: fiservPremierAuth,
  displayName: 'Get Party',
  description: 'Get party information by Party ID',
  props: {
    partyId: Property.ShortText({
      displayName: 'Party ID',
      description: 'The ID of the party to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const organizationId = auth.organizationId;
    const { partyId } = context.propsValue;

    // Generate a unique transaction ID
    const trnId = crypto.randomUUID();

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/banking/efx/v1/partyservice/parties/parties/secured`,
      headers: {
        'accept': 'application/json',
        'EFXHeader': JSON.stringify({
          OrganizationId: organizationId,
          TrnId: trnId,
        }),
        'Content-Type': 'application/json',
      },
      body: {
        PartySel: {
          PartyKeys: {
            PartyId: partyId,
          },
        },
      },
    });

    return response.body;
  },
});
