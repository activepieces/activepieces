import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fiservPremierAuth } from '../..';

export const addParty = createAction({
  name: 'add_party',
  auth: fiservPremierAuth,
  displayName: 'Add Party',
  description: 'Create a new party (person or organization)',
  props: {
    partyData: Property.Json({
      displayName: 'Party Data',
      description: 'The complete party information as JSON object (PersonPartyInfo or OrgPartyInfo)',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const organizationId = auth.organizationId;
    const { partyData } = context.propsValue;

    const trnId = crypto.randomUUID();

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/banking/efx/v1/partyservice/parties/parties`,
      headers: {
        'accept': 'application/json',
        'EFXHeader': JSON.stringify({
          OrganizationId: organizationId,
          TrnId: trnId,
        }),
        'Content-Type': 'application/json',
      },
      body: partyData,
    });

    return response.body;
  },
});
