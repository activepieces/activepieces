import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { apiverveAuth } from '../auth';
import { apiverveCommon } from '../common';

export const validateEmailAction = createAction({
  auth: apiverveAuth,
  name: 'validate_email',
  classification: 'READ',
  displayName: 'Validate Email',
  description:
    'Check whether an email address is well-formed, can receive mail, and is safe to accept.',
  audience: 'both',
  aiMetadata: {
    description:
      'Validate one email address: syntax, MX records, SPF and DMARC, and whether it is disposable, a role address or a free provider. Use before saving a lead or contact. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to check, for example jane@example.com.',
      required: true,
    }),
  },
  async run(context) {
    return apiverveCommon.callApiverve({
      apiKey: context.auth.secret_text,
      path: '/v1/emailvalidator',
      method: HttpMethod.GET,
      query: apiverveCommon.toQuery({ email: context.propsValue.email }),
    });
  },
});
