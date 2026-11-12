import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaApi } from '../common/client';
import { genayaInput } from '../common/input';
import { genayaOutput } from '../common/mappers';
import { genayaProps } from '../common/props';
import { GenayaClient } from '../common/types';

export const createClient = createAction({
  auth: genayaAuth,
  name: 'create_client',
  classification: 'WRITE',
  displayName: 'Create Client',
  description:
    'Creates a client in Genaya. If a client with the same email or phone already exists, that client is updated instead of creating a duplicate.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a client (customer, patient) in Genaya, or update the existing active client that matches the email, then the phone. Needs at least one of first name, last name, company, email or phone. Use Find Client first when you only need to look a client up. A retry with the same email or phone updates the same client; without them it can create a second client.',
    idempotent: false,
  },
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The client\'s business name, for example Avery Industries.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'For example jordan@example.com. Used to match an existing client.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Preferably in international format, for example +14155550142. Used to match an existing client.',
      required: false,
    }),
    secondary_phone: Property.ShortText({
      displayName: 'Secondary Phone',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Salutation, for example Dr. or Ms.',
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      description: 'How the client found you, for example Website or Google.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Defaults to Active.',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    ...genayaProps.addressProps(),
  },
  async run(context) {
    const props = context.propsValue;
    const body = genayaInput.compact({
      firstName: genayaInput.text(props.first_name),
      lastName: genayaInput.text(props.last_name),
      company: genayaInput.text(props.company),
      email: genayaInput.text(props.email),
      phone: genayaInput.text(props.phone),
      secondaryPhone: genayaInput.text(props.secondary_phone),
      title: genayaInput.text(props.title),
      leadSource: genayaInput.text(props.lead_source),
      status: genayaInput.text(props.status),
      address: genayaInput.address({
        line1: props.address_line1,
        unit: props.address_unit,
        city: props.address_city,
        state: props.address_state,
        zip: props.address_zip,
        country: props.address_country,
      }),
    });
    if (!body['firstName'] && !body['lastName'] && !body['company'] && !body['email'] && !body['phone']) {
      throw new Error('Provide at least one of First Name, Last Name, Company, Email or Phone.');
    }
    const response = await genayaApi.request<{ data: GenayaClient }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/clients',
      body,
    });
    return genayaOutput.client(response.data);
  },
});
