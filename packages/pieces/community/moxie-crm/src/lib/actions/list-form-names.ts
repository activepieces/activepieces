import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf, asArray } from '../common';
import { moxieRequest } from '../common/client';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieListFormNamesAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_form_names',
  classification: 'SEARCH',
  displayName: 'List Form Names',
  description: 'List the names of the lead and discovery forms.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the names of the lead and discovery forms in the Moxie workspace. Use to pick a valid form name before Submit Lead Form. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.nameList,
  props: {

  },
  async run({ auth }) {
    const result = await moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/formNames/list',
    });
    return asArray({ value: result }).filter((name): name is string => typeof name === 'string').map((name) => ({ name }));
  },
});
