import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getWorkEmailLookup = createAction({
  name: 'get_work_email_lookup',
  auth: enrichlayerAuth,
  displayName: 'Look Up Work Email',
  description:
    'Get the work email address for a professional network profile. 95%+ deliverability guarantee (3 credits)',
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
      context.auth as string,
      ENDPOINTS.WORK_EMAIL_LOOKUP,
      {
        profile_url: context.propsValue.profile_url,
        callback_url: context.propsValue.callback_url,
      },
    );
  },
});
