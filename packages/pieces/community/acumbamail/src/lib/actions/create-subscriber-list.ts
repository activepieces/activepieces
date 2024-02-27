import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { acumbamailAuth } from '../../';
import { acumbamailCommon } from '../common';

export const createSubscriberListAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_create_subscriber_list',
  displayName: 'Create Subscriber List',
  description: 'Creates a new subscriber list.',
  props: {
    listname: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
    sender_email: Property.ShortText({
      displayName: 'Sener Email',
      description:
        'Sender e-mail shown to the subscribers of the list when e-mail marketing campaigns are sent to them.',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Company Address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Company Phone',
      required: false,
    }),
  },
  async run(context) {
    const { listname, sender_email, company, address, phone } =
      context.propsValue;

    const form = new FormData();
    form.append('auth_token', context.auth);
    form.append('name', listname);
    form.append('sender_email', sender_email);
    form.append('company', company ?? '');
    form.append('address', address ?? '');
    form.append('phone', phone ?? '');

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: acumbamailCommon.baseUrl + '/createList/',
      headers: form.getHeaders(),
      body: form,
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
