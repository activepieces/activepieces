import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { acumbamailAuth } from '../auth';
import { acumbamailCommon } from '../common';

export const createSubscriberListAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_create_subscriber_list',
  classification: 'WRITE',
  displayName: 'Create Subscriber List',
  description: 'Creates a new subscriber list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new Acumbamail subscriber list, requiring a list name and the sender email shown to subscribers when campaigns go out (company name, address, and phone are optional). Use when a contact list does not yet exist and must be provisioned before adding subscribers or sending campaigns. Not idempotent: each call creates a separate list even with the same name.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'list',
      display: 'section',
      label: 'List details',
      icon: 'inbox',
      props: ['listname', 'sender_email'],
    },
    {
      key: 'company',
      display: 'section',
      label: 'Company details',
      icon: 'location',
      props: ['company', 'phone', 'address'],
    },
  ],
  props: {
    listname: Property.ShortText({
      displayName: 'List Name',
      required: true,
      placeholder: 'Monthly newsletter',
    }),
    sender_email: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Sender address for emails sent from this list.',
      required: true,
      placeholder: 'news@example.com',
    }),
    company: Property.ShortText({
      displayName: 'Company Name',
      required: false,
      placeholder: 'Acme Inc.',
      width: 'half',
    }),
    phone: Property.ShortText({
      displayName: 'Company Phone',
      required: false,
      placeholder: '+34 900 000 000',
      width: 'half',
    }),
    address: Property.ShortText({
      displayName: 'Company Address',
      required: false,
      placeholder: 'Calle Mayor 1, Madrid',
    }),
  },
  async run(context) {
    const { listname, sender_email, company, address, phone } =
      context.propsValue;

    const form = new FormData();
    form.append('auth_token', context.auth.secret_text);
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
