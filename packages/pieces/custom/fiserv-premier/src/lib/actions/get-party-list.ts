import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fiservPremierAuth } from '../..';

export const getPartyList = createAction({
  name: 'get_party_list',
  auth: fiservPremierAuth,
  displayName: 'Get Party List',
  description: 'Get a list of parties with optional filtering',
  props: {
    taxId: Property.ShortText({
      displayName: 'Tax ID',
      description: 'Filter by Tax ID (optional)',
      required: false,
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 25,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (optional)',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const organizationId = auth.organizationId;
    const { taxId, maxRecords, cursor } = context.propsValue;

    const trnId = crypto.randomUUID();

    const body: any = {
      RecCtrlIn: {
        MaxRecLimit: maxRecords || 25,
        Cursor: cursor || '',
      },
    };

    if (taxId) {
      body.PartyListSel = {
        TaxIdent: taxId,
      };
    }

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
      body,
    });

    return response.body;
  },
});
