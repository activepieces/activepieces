import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf, asArray } from '../common';
import { moxieRequest } from '../common/client';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieListVendorsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_vendors',
  classification: 'SEARCH',
  displayName: 'List Vendors',
  description: 'List the vendor names of the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the names of the vendors in the Moxie workspace. Use to pick a valid vendor name before creating an expense. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.nameList,
  props: {

  },
  async run({ auth }) {
    const result = await moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/vendors/list',
    });
    return asArray({ value: result }).filter((name): name is string => typeof name === 'string').map((name) => ({ name }));
  },
});
