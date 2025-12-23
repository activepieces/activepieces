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
  description: 'Get party information by Party ID or Tax ID',
  props: {
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose how to search for the party',
      required: true,
      options: {
        options: [
          { label: 'Party ID', value: 'partyId' },
          { label: 'Tax ID', value: 'taxId' },
        ],
      },
      defaultValue: 'partyId',
    }),
    partyId: Property.ShortText({
      displayName: 'Party ID',
      description: 'The ID of the party to retrieve',
      required: false,
    }),
    taxId: Property.ShortText({
      displayName: 'Tax ID',
      description: 'The Tax ID to search for',
      required: false,
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'Maximum number of records to return (only for Tax ID search)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const organizationId = auth.organizationId;
    const { searchType, partyId, taxId, maxRecords } = context.propsValue;

    const trnId = crypto.randomUUID();

    if (searchType === 'partyId') {
      // Search by Party ID - single record
      if (!partyId) {
        throw new Error('Party ID is required when search type is Party ID');
      }

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
    } else {
      // Search by Tax ID - list of records
      if (!taxId) {
        throw new Error('Tax ID is required when search type is Tax ID');
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
    }
  },
});
