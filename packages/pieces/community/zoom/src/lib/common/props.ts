import { Property } from '@activepieces/pieces-framework';

export const getRegistarantProps = () => ({
  meeting_id: Property.ShortText({
    displayName: 'Meeting ID',
    description: 'The meeting ID.',
    required: true,
  }),
  first_name: Property.ShortText({
    displayName: 'First name',
    description: "The registrant's first name.",
    required: true,
  }),
  last_name: Property.ShortText({
    displayName: 'Last name',
    description: "The registrant's last name.",
    required: false,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    description: "The registrant's email address.",
    required: true,
  }),
  address: Property.ShortText({
    displayName: 'Address',
    description: "The registrant's address",
    required: false,
  }),
  city: Property.ShortText({
    displayName: 'City',
    description: "The registrant's city",
    required: false,
  }),
  state: Property.ShortText({
    displayName: 'State',
    description: "The registrant's state or province.",
    required: false,
  }),
  zip: Property.ShortText({
    displayName: 'Zip',
    description: "The registrant's zip or postal code.",
    required: false,
  }),
  country: Property.ShortText({
    displayName: 'Country',
    description: "The registrant's two-letter country code.",
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    description: "The registrant's phone number.",
    required: false,
  }),
  comments: Property.LongText({
    displayName: 'Comments',
    description: "The registrant's questions and comments.",
    required: false,
  }),
  custom_questions: Property.Object({
    displayName: 'Custom questions',
    description: '',
    required: false,
  }),
  industry: Property.ShortText({
    displayName: 'Industry',
    description: "The registrant's industry.",
    required: false,
  }),
  job_title: Property.ShortText({
    displayName: 'Job title',
    description: "The registrant's job title.",
    required: false,
  }),
  no_of_employees: Property.ShortText({
    displayName: 'No of employees',
    description: "The registrant's number of employees.",
    required: false,
  }),
  org: Property.ShortText({
    displayName: 'Organization',
    description: "The registrant's organization.",
    required: false,
  }),
  purchasing_time_frame: Property.ShortText({
    displayName: 'Purchasing time frame',
    description: "The registrant's purchasing time frame.",
    required: false,
  }),
  role_in_purchase_process: Property.ShortText({
    displayName: 'Role in purchase process',
    description: "The registrant's role in the purchase process.",
    required: false,
  }),
});
