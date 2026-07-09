import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';

export const unsubscribeContactAction = createAction({
  name: 'unsubscribe_contact',
  displayName: 'Unsubscribe Contact',
  description:
    'Unsubscribe one or more email addresses from future emails in Elastic Email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Marks one or more email addresses as unsubscribed in Elastic Email so they no longer receive future emails. Use to honor opt-out or suppression requests. Idempotent: re-running with the same addresses leaves them unsubscribed with no additional effect.',
    idempotent: true,
  },
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
