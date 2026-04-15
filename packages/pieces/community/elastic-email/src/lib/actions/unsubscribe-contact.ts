import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';

export const unsubscribeContactAction = createAction({
  name: 'unsubscribe_contact',
  displayName: 'Unsubscribe Contact',
  description:
    'Unsubscribe one or more email addresses from future emails in Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    emails: Property.Array({
      displayName: 'Email Addresses',
      description:
        'List of email addresses to unsubscribe.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const emails = (propsValue.emails ?? []).map(String);
    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/suppressions/unsubscribes',
      body: emails,
    });
  },
});
