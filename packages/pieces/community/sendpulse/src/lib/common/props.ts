import { Property } from '@activepieces/pieces-framework';

export const mailingListId = Property.ShortText({
  displayName: 'Mailing List ID',
  description: 'The unique identifier of the SendPulse mailing list (address book).',
  required: true,
});

export const email = Property.ShortText({
  displayName: 'Email',
  description: 'The email address of the subscriber.',
  required: false,
});

export const phone = Property.ShortText({
  displayName: 'Phone',
  description: 'The phone number of the subscriber (E.164 format, e.g., +1234567890).',
  required: false,
});

export const emails = Property.Array({
  displayName: 'Emails',
  description: 'A list of email addresses for batch operations.',
  required: false,
});

export const phones = Property.Array({
  displayName: 'Phones',
  description: 'A list of phone numbers for batch operations.',
  required: false,
});

export const variables = Property.Object({
  displayName: 'Variables',
  description: 'Custom variables to associate with the subscriber (object of key-value pairs).',
  required: false,
});

export const variableName = Property.ShortText({
  displayName: 'Variable Name',
  description: 'The name of the variable to update for the subscriber.',
  required: true,
});

export const variableValue = Property.ShortText({
  displayName: 'Variable Value',
  description: 'The value to set for the specified variable.',
  required: true,
});

export const optInType = Property.StaticDropdown({
  displayName: 'Opt-In Type',
  description: 'Choose the opt-in type for adding subscribers.',
  required: false,
  options: {
    options: [
      { label: 'Single Opt-In', value: 'single' },
      { label: 'Double Opt-In', value: 'double' },
    ],
  },
}); 