import { createAction } from '@activepieces/pieces-framework';
import { fetchProjectsDocument } from '../api';
import { aconexAuth } from '../auth';
import { assertAuthProps, readAuth } from '../auth-props';

export const listProjectsAction = createAction({
  auth: aconexAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'List Aconex projects this connection can see. Inactive and hidden projects are included.',
  classification: 'READ',
  props: {},
  async run(context) {
    return fetchProjectsDocument(assertAuthProps(readAuth(context.auth)));
  },
});
