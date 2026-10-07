import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieSearchAgreementsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_agreements',
  classification: 'SEARCH',
  displayName: 'Search Agreements',
  description: 'List agreements (contracts), for one client or by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Moxie agreements (contracts) with their status and signatures: every one, those of a client id, or the one agreement with an exact Agreement ID. Use to check whether a client has signed before starting work or invoicing. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.agreementList,
  props: {
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Only agreements of this client, from Search Clients.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Agreement ID',
      description: 'Exact agreement id. When set, the client id is ignored.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/agreements/search',
      query: {
        clientId: moxieInput.optionalId({ value: propsValue.clientId, field: 'Client ID' }),
        id: moxieInput.optionalId({ value: propsValue.id, field: 'Agreement ID' }),
      },
    });
  },
});
