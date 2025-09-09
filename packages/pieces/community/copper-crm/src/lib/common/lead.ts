import { Property } from "@activepieces/pieces-framework";

export const leadId = Property.ShortText({
  displayName: 'Lead ID',
  description: 'Unique identifier for the Lead',
  required: false,
});

export const leadName = Property.ShortText({
  displayName: 'Name',
  description: 'The first and last name of the Lead',
  required: true,
});

export const leadAddress = Property.Array({
  displayName: 'Address',
  description: 'An object containing the Lead\'s street, city, state, postal code, and country',
  required: false,
  properties: {
    street: Property.ShortText({
      displayName: 'Street',
      description: 'The street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'The state or province',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      description: 'The postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'The country',
      required: false,
    }),
  },
});

export const leadAssigneeId = Property.Number({
  displayName: 'Assignee ID',
  description: 'Unique identifier of the User that will be the owner of the Lead',
  required: false,
});

export const leadCompanyName = Property.ShortText({
  displayName: 'Company Name',
  description: 'The name of the company to which the Lead belongs',
  required: false,
});

export const leadCustomerSourceId = Property.Number({
  displayName: 'Customer Source ID',
  description: 'Unique identifier of the Customer Source that generated this Lead',
  required: false,
});

export const leadDetails = Property.LongText({
  displayName: 'Details',
  description: 'Description of the Lead',
  required: false,
});

export const leadEmail = Property.Array({
  displayName: 'Email',
  description: 'An object containing the Lead\'s email address and category',
  required: false,
  properties: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The Lead\'s email address',
      required: true,
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'The category of the email address (e.g., work, home)',
      required: false,
      options: {
        options: [
          { label: 'Work', value: 'work' },
          { label: 'Home', value: 'home' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
  },
});

export const leadMonetaryValue = Property.Number({
  displayName: 'Monetary Value',
  description: 'The expected monetary value of business with the Lead',
  required: false,
});

export const leadPhoneNumbers = Property.Array({
  displayName: 'Phone Numbers',
  description: 'An array of phone numbers belonging to the Lead',
  required: false,
  properties: {
    number: Property.ShortText({
      displayName: 'Number',
      description: 'A phone number',
      required: true,
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'The category of the phone number (e.g., mobile, work, home)',
      required: false,
      options: {
        options: [
          { label: 'Mobile', value: 'mobile' },
          { label: 'Work', value: 'work' },
          { label: 'Home', value: 'home' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
  },
});

export const leadSocials = Property.Array({
  displayName: 'Social Profiles',
  description: 'An array of social profiles belonging to the Lead',
  required: false,
  properties: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of a social profile',
      required: true,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'The category of the social profile',
      required: false,
    }),
  },
});

export const leadStatus = Property.StaticDropdown({
  displayName: 'Status',
  description: 'A string representing the status of the Lead',
  required: false,
  options: {
    options: [
      { label: 'New', value: 'New' },
      { label: 'Unqualified', value: 'Unqualified' },
      { label: 'Contacted', value: 'Contacted' },
      { label: 'Qualified', value: 'Qualified' },
    ],
  },
});

export const leadTags = Property.Array({
  displayName: 'Tags',
  description: 'An array of tags associated with the Lead',
  required: false
});

export const leadTitle = Property.ShortText({
  displayName: 'Title',
  description: 'The professional title of the Lead',
  required: false,
});

export const leadWebsites = Property.Array({
  displayName: 'Websites',
  description: 'An array of websites belonging to the Lead',
  required: false,
  properties: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of a website',
      required: true,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'The category of the website',
      required: false,
    }),
  },
});

export const leadCustomFields = Property.Array({
  displayName: 'Custom Fields',
  description: 'An array of custom field values belonging to the Lead',
  required: false,
  properties: {
    customFieldDefinitionId: Property.Number({
      displayName: 'Custom Field Definition ID',
      description: 'The ID of the Custom Field Definition',
      required: true,
    }),
    value: Property.Json({
      displayName: 'Value',
      description: 'The value of this Custom Field',
      required: false,
    }),
  },
});

export const leadDateCreated = Property.DateTime({
  displayName: 'Date Created',
  description: 'A Unix timestamp representing the time at which this Lead was created',
  required: false,
});

export const leadDateModified = Property.DateTime({
  displayName: 'Date Modified',
  description: 'A Unix timestamp representing the time at which this Lead was last modified',
  required: false,
});

export const leadEmails = Property.Array({
    displayName: 'Emails',
    description: 'An array of email addresses for the Lead, each with a category.',
    required: false,
    properties: {
        email: Property.ShortText({ displayName: 'Email Address', required: true }),
        category: Property.ShortText({
            displayName: 'Category',
            required: true,
        }),
    },
});