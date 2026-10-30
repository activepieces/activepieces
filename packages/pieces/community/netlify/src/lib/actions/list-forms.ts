import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const listForms = createAction({
  auth: netlifyAuth,
  name: 'list_forms',
  classification: 'SEARCH',
  displayName: 'List Forms',
  description: 'List the forms of a site with their submission counts.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists the Netlify Forms detected on one site with their ID, name, field names and submission count. Use a form ID with List Form Submissions. Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.formList,
  props: { siteId: netlifyProps.siteDropdown({ description: 'The site whose forms to list.' }) },
  async run({ auth, propsValue }) {
    return netlifyOperations.listForms({ auth, siteId: propsValue.siteId });
  },
});

export const listFormsById = createAction({
  auth: netlifyAuth,
  name: 'list_forms_by_id',
  classification: 'SEARCH',
  displayName: 'List Forms by Site ID',
  description: 'List the forms of a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Netlify Forms detected on one site with their ID, name, field names and submission count. Use a form ID with List Form Submissions. Read-only. Get the site ID from List Sites.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.formList,
  props: { siteId: netlifyProps.siteId() },
  async run({ auth, propsValue }) {
    return netlifyOperations.listForms({ auth, siteId: propsValue.siteId });
  },
});
