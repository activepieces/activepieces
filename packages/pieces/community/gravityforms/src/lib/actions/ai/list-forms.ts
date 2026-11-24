import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsApi } from '../../common/api';
import { gravityformsListFormsOutputSchema } from '../../output-schemas';

export const listFormsAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_list_forms',
  outputSchema: gravityformsListFormsOutputSchema,
  displayName: 'List Forms',
  description: 'Lists every form on the site with its id, title and entry count.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all Gravity Forms forms with their id, title and entry count. Use it to find the form id that other actions take; use Get Form for a form\'s fields.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const forms = Object.values(await gravityFormsApi.listForms({ auth: context.auth }));
    return { forms, count: forms.length };
  },
});
