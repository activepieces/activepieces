import { Property } from '@activepieces/pieces-framework';

export const contactProps = {
  firstName: Property.ShortText({
    displayName: 'First Name',
    description: 'Contact first name',
    required: true,
  }),
  lastName: Property.ShortText({
    displayName: 'Last Name',
    description: 'Contact last name',
    required: true,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    description: 'Contact email address',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    description: 'Contact phone number',
    required: false,
  }),
  company: Property.ShortText({
    displayName: 'Company',
    description: 'Contact company name',
    required: false,
  }),
  position: Property.ShortText({
    displayName: 'Position',
    description: 'Contact position/title',
    required: false,
  }),
  notes: Property.LongText({
    displayName: 'Notes',
    description: 'Additional notes about the contact',
    required: false,
  }),
};

export const companyProps = {
  name: Property.ShortText({
    displayName: 'Company Name',
    description: 'Company name',
    required: true,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    description: 'Company email address',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    description: 'Company phone number',
    required: false,
  }),
  address: Property.LongText({
    displayName: 'Address',
    description: 'Company address',
    required: false,
  }),
  website: Property.ShortText({
    displayName: 'Website',
    description: 'Company website',
    required: false,
  }),
  notes: Property.LongText({
    displayName: 'Notes',
    description: 'Additional notes about the company',
    required: false,
  }),
};

export const opportunityProps = {
  title: Property.ShortText({
    displayName: 'Title',
    description: 'Opportunity title',
    required: true,
  }),
  amount: Property.Number({
    displayName: 'Amount',
    description: 'Opportunity amount',
    required: false,
  }),
  currency: Property.ShortText({
    displayName: 'Currency',
    description: 'Currency code (e.g., USD, EUR)',
    required: false,
  }),
  stage: Property.ShortText({
    displayName: 'Stage',
    description: 'Opportunity stage',
    required: false,
  }),
  notes: Property.LongText({
    displayName: 'Notes',
    description: 'Additional notes about the opportunity',
    required: false,
  }),
}; 