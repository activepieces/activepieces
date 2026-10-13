import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieListProjectTypesAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_project_types',
  classification: 'SEARCH',
  displayName: 'List Project Types',
  description: 'List the project types with their task stages and custom fields.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Moxie project types with their task stages and the custom project and task fields each defines. Use to find the stage ids of a specific project type before moving tasks. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.projectTypeList,
  props: {

  },
  async run({ auth }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/projectTypes/list',
    });
  },
});
