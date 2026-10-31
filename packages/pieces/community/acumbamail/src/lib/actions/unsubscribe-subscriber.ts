import { acumbamailAuth } from '../auth';
import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { acumbamailCommon } from '../common';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const unsubscribeAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_unsubscribe_subscriber',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Subscriber',
  description: 'Stops emails to a subscriber on a list, keeping their record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Marks an email address as unsubscribed from a specific Acumbamail subscriber list, so the contact stops receiving campaigns for that list while remaining a stored subscriber. Use to honor an opt-out without removing the contact record; requires the list id and the email. Differs from Remove Subscriber, which deletes the membership entirely. Idempotent: re-running leaves the contact in the same unsubscribed state.',
    idempotent: true,
  },
  props: {
    unsubscribe_info: Property.MarkDown({
      value:
        'Keeps the subscriber on the list but stops emails. To delete them, use Remove Subscriber.',
      variant: MarkdownVariant.INFO,
    }),
    listId: acumbamailCommon.listId,
    email: Property.ShortText({
      displayName: 'Subscriber Email',
      placeholder: 'jane@example.com',
      required: true,
    }),
  },
  async run(context) {
    const { listId, email } = context.propsValue;
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: acumbamailCommon.baseUrl + '/unsubscribeSubscriber/',
      queryParams: {
        auth_token: context.auth.secret_text,
        list_id: listId.toString(),
        email: email,
      },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
