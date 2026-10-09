import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieListEmailTemplatesAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_email_templates',
  classification: 'SEARCH',
  displayName: 'List Email Templates',
  description: 'List the email templates of the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the id and name of every email template in the Moxie workspace. Use to pick a template name for sending an invoice, or an id for Get Email Template. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.emailTemplateList,
  props: {

  },
  async run({ auth }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/emailTemplates',
    });
  },
});
