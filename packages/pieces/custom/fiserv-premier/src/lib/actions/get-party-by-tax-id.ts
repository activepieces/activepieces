import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fiservPremierAuth } from '../..';

export const getPartyByTaxId = createAction({
  name: 'get_party_by_tax_id',
  auth: fiservPremierAuth,
  displayName: 'Get Party by Tax ID',
  description: 'Get party information by Tax ID',
  props: {
    taxId: Property.ShortText({
      displayName: 'Tax ID',
      description: 'The Tax ID to search for',
      required: true,
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const organizationId = auth.organizationId;
    const { taxId, maxRecords } = context.propsValue;

    const trnId = crypto.randomUUID();

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/banking/efx/v1/partyservice/parties/parties/secured/list`,
      headers: {
        'accept': 'application/json',
        'EFXHeader': JSON.stringify({
          OrganizationId: organizationId,
          TrnId: trnId,
        }),
        'Content-Type': 'application/json',
      },
      body: {
        RecCtrlIn: {
          MaxRecLimit: maxRecords || 25,
          Cursor: '',
        },
        PartyListSel: {
          TaxIdent: taxId,
        },
      },
    });

    return response.body;
  },
});
