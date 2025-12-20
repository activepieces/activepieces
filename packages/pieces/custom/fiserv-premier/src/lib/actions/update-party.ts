import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fiservPremierAuth } from '../..';

export const updateParty = createAction({
  name: 'update_party',
  auth: fiservPremierAuth,
  displayName: 'Update Party',
  description: 'Update an existing party',
  props: {
    partyId: Property.ShortText({
      displayName: 'Party ID',
      description: 'The ID of the party to update',
      required: true,
    }),
    partyData: Property.Json({
      displayName: 'Party Data',
      description: 'The updated party information as JSON object (PersonPartyInfo or OrgPartyInfo)',
      required: true,
    }),
    overrideAutoAck: Property.Checkbox({
      displayName: 'Override Auto Acknowledgment',
      description: 'Override automatic acknowledgment',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const organizationId = auth.organizationId;
    const { partyId, partyData, overrideAutoAck } = context.propsValue;

    const trnId = crypto.randomUUID();

    const body: any = {
      OvrdAutoAckInd: overrideAutoAck !== undefined ? String(overrideAutoAck) : 'true',
      PartyKeys: {
        PartyId: partyId,
      },
      ...partyData,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${baseUrl}/banking/efx/v1/partyservice/parties/parties`,
      headers: {
        'accept': 'application/json',
        'EFXHeader': JSON.stringify({
          OrganizationId: organizationId,
          TrnId: trnId,
        }),
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
