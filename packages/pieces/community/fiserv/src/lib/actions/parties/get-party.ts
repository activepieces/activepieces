import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../common/auth';
import { ENDPOINTS } from '../../common/constants';

export const getParty = createAction({
  name: 'party_get',
  displayName: 'Party - Get',
  description: 'Retrieve party (customer) information by Party ID or Tax ID',
  auth: fiservAuth,
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
    includeFullDetails: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Include all party details (addresses, phone numbers, emails)',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { searchType, partyId, taxId, maxRecords, includeFullDetails } = context.propsValue;
    const auth = context.auth as any;

    if (searchType === 'partyId') {
      // Search by Party ID - single record
      if (!partyId) {
        throw new Error('Party ID is required when search type is Party ID');
      }

      const requestBody = {
        PartyKeys: {
          PartyId: partyId,
        },
        IncludeFullDetails: includeFullDetails,
      };

      const response = await callFiservApi(
        HttpMethod.POST,
        auth,
        ENDPOINTS.PARTIES_GET,
        requestBody
      );

      return response.body;
    } else {
      // Search by Tax ID - list of records
      if (!taxId) {
        throw new Error('Tax ID is required when search type is Tax ID');
      }

      const requestBody = {
        RecCtrlIn: {
          MaxRecLimit: maxRecords || 25,
          Cursor: '',
        },
        PartyListSel: {
          TaxIdent: taxId,
        },
      };

      // Tax ID search uses a different endpoint for list results
      const response = await callFiservApi(
        HttpMethod.POST,
        auth,
        `${ENDPOINTS.PARTIES_GET}/list`,
        requestBody
      );

      return response.body;
    }
  },
});
