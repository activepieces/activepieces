import { createAction, Property } from '@activepieces/pieces-framework';
import { oncehubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: oncehubAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description:
    'Create a new contact in Oncehub. Either email or mobile_phone is required.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'Email address of the contact (at least email or mobile_phone required)',
      required: false,
    }),
    mobile_phone: Property.ShortText({
      displayName: 'Mobile Phone',
      description:
        'Mobile phone number in E.164 format (at least email or mobile_phone required)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number in E.164 format',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name',
      required: false,
    }),
    job_title: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title of the contact',
      required: false,
    }),
    street_address: Property.ShortText({
      displayName: 'Street Address',
      description: 'Street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City of the contact',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State or province',
      required: false,
    }),
    post_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country of the contact',
      required: false,
    }),
    company_size: Property.ShortText({
      displayName: 'Company Size',
      description: "Size of the contact's company",
      required: false,
    }),
    employees: Property.Number({
      displayName: 'Employees',
      description: 'Number of employees',
      required: false,
    }),
    salutation: Property.ShortText({
      displayName: 'Salutation',
      description: 'Salutation (e.g., Mr., Ms., Dr.)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status of the contact',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Qualified', value: 'Qualified' },
          { label: 'Sales qualified', value: 'Sales qualified' },
          { label: 'Marketing qualified', value: 'Marketing qualified' },
          { label: 'Disqualified', value: 'Disqualified' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      first_name,
      last_name,
      email,
      mobile_phone,
      phone,
      company,
      job_title,
      street_address,
      city,
      state,
      post_code,
      country,
      company_size,
      employees,
      salutation,
      status,
    } = context.propsValue;

    const api_key = context.auth.secret_text;

    if (!email && !mobile_phone) {
      throw new Error('Either email or mobile_phone is required');
    }

    const body: any = {
      first_name,
      last_name,
    };

    if (email) body.email = email;
    if (mobile_phone) body.mobile_phone = mobile_phone;
    if (phone) body.phone = phone;
    if (company) body.company = company;
    if (job_title) body.job_title = job_title;
    if (street_address) body.street_address = street_address;
    if (city) body.city = city;
    if (state) body.state = state;
    if (post_code) body.post_code = post_code;
    if (country) body.country = country;
    if (company_size) body.company_size = company_size;
    if (employees !== undefined) body.employees = employees;
    if (salutation) body.salutation = salutation;
    if (status) body.status = status;

    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      '/contacts',
      body
    );

    return response;
  },
});
