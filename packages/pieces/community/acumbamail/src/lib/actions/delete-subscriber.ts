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

export const removeSubscribeAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_remove_subscriber',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Subscriber',
  description: 'Deletes a subscriber from a list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a contact\'s membership from a specific Acumbamail subscriber list by email, fully removing them from that list (unlike Unsubscribe Subscriber, which only marks them opted-out while keeping the record). Use to purge a contact from a list; requires the list id and the email. Idempotent: once removed, repeating the call leaves the contact absent from the list.',
    idempotent: true,
  },
  props: {
    removal_info: Property.MarkDown({
      value:
        'Deletes the subscriber from this list. To keep them but stop emails, use Unsubscribe Subscriber.',
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
      url: acumbamailCommon.baseUrl + '/deleteSubscriber/',
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
