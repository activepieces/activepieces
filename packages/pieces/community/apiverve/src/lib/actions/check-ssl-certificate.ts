import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { apiverveAuth } from '../auth';
import { apiverveCommon } from '../common';

export const checkSslCertificateAction = createAction({
  auth: apiverveAuth,
  name: 'check_ssl_certificate',
  classification: 'READ',
  displayName: 'Check SSL Certificate',
  description:
    "Get the issuer, validity dates and expiry of a website's SSL certificate.",
  audience: 'both',
  aiMetadata: {
    description:
      'Inspect the SSL certificate served by one domain and return its issuer, subject, validity dates and expiry. Use to monitor certificate expiry. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain to check, without https://, for example github.com.',
      required: true,
    }),
  },
  async run(context) {
    return apiverveCommon.callApiverve({
      apiKey: context.auth.secret_text,
      path: '/v1/sslchecker',
      method: HttpMethod.GET,
      query: apiverveCommon.toQuery({ domain: context.propsValue.domain }),
    });
  },
});
