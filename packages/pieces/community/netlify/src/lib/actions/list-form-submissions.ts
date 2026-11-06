import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const listFormSubmissions = createAction({
  auth: netlifyAuth,
  name: 'list_form_submissions',
  classification: 'SEARCH',
  displayName: 'List Form Submissions',
  description: 'List the submissions of a form, newest first.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists the verified submissions of one Netlify form, newest first, one page at a time (Per Page up to 100; ask for the next page when a full page comes back). Each submission has its number, email, name, submitted field values and time. Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.submissionList,
  props: {
    siteId: netlifyProps.siteDropdown({ description: 'The site the form belongs to.' }),
    formId: netlifyProps.formDropdown(),
    page: netlifyProps.page(),
    perPage: netlifyProps.perPage({ defaultValue: 100 }),
  },
  async run({ auth, propsValue }) {
    return netlifyOperations.listSubmissions({ auth, formId: propsValue.formId, page: propsValue.page, perPage: propsValue.perPage });
  },
});

export const listFormSubmissionsById = createAction({
  auth: netlifyAuth,
  name: 'list_form_submissions_by_id',
  classification: 'SEARCH',
  displayName: 'List Form Submissions by Form ID',
  description: 'List the submissions of a form given its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the verified submissions of one Netlify form, newest first, one page at a time (Per Page up to 100; ask for the next page when a full page comes back). Each submission has its number, email, name, submitted field values and time. Read-only. Get the form ID from List Forms.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.submissionList,
  props: {
    formId: Property.ShortText({ displayName: 'Form ID', description: 'The Netlify form ID. Use List Forms to find it.', required: true }),
    page: netlifyProps.page(),
    perPage: netlifyProps.perPage({ defaultValue: 20 }),
  },
  async run({ auth, propsValue }) {
    return netlifyOperations.listSubmissions({ auth, formId: propsValue.formId, page: propsValue.page, perPage: propsValue.perPage });
  },
});
