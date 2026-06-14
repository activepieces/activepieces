import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getWorkEmailLookup = createAction({
  name: 'get_work_email_lookup',
  auth: enrichlayerAuth,
  displayName: 'Look Up Work Email',
  description:
    'Get the work email address for a professional network profile. 95%+ deliverability guarantee (3 credits)',
  audience: 'both',
  aiMetadata: {
    description:
      "Find a person's work (business) email address from their professional-network profile URL, with a 95%+ deliverability guarantee. Read-only and safe to retry. Use for B2B/work contact; for personal emails use Look Up Personal Email, and to go from an email back to profiles use Reverse Email Lookup. Processing may be asynchronous, so an optional callback URL can be supplied for completion notification.",
    idempotent: true,
  },
  props: {
    profile_url: Property.ShortText({
      displayName: 'Profile URL',
      description:
        'Professional network profile URL (e.g., https://sg.linkedin.com/in/williamhgates)',
      required: true,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description:
        'Webhook URL to notify when the request finishes processing (optional)',
      required: false,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.WORK_EMAIL_LOOKUP,
      {
        profile_url: context.propsValue.profile_url,
        callback_url: context.propsValue.callback_url,
      },
    );
  },
});
