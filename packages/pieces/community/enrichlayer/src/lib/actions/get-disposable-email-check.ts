import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getDisposableEmailCheck = createAction({
  name: 'get_disposable_email_check',
  auth: enrichlayerAuth,
  displayName: 'Check Disposable Email',
  description:
    'Check if an email address belongs to a disposable email service (0 credits)',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description:
        'Email address to check (e.g., johndoe@enrichlayer.com)',
      required: true,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.DISPOSABLE_EMAIL,
      {
        email: context.propsValue.email,
      },
    );
  },
});
