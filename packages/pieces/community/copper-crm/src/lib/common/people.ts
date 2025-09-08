import { Property } from '@activepieces/pieces-framework';

export const personId = Property.ShortText({
    displayName: 'Person ID',
    description: 'The unique identifier for the Person.',
    required: true,
});

export const personName = Property.ShortText({
    displayName: 'Name',
    description: 'The first and last name of the Person.',
    required: true,
});

export const personAssigneeId = Property.ShortText({
    displayName: 'Assignee ID',
    description: 'The unique identifier of the User who owns this Person.',
    required: false,
});

export const personCompanyId = Property.ShortText({
    displayName: 'Company ID',
    description: 'The unique identifier of the primary Company associated with this Person.',
    required: false,
});

export const personCompanyName = Property.ShortText({
    displayName: 'Company Name',
    description: 'The name of the primary Company associated with this Person.',
    required: false,
});

export const personContactTypeId = Property.ShortText({
    displayName: 'Contact Type ID',
    description: 'The unique identifier of the Contact Type for this Person.',
    required: false,
});

export const personDetails = Property.ShortText({
    displayName: 'Details',
    description: 'A description or additional details about the Person.',
    required: false,
});

export const personTags = Property.Array({
    displayName: 'Tags',
    description: 'An array of tags associated with the Person, represented as strings.',
    required: false,
    defaultValue: [],
});

export const personTitle = Property.ShortText({
    displayName: 'Title',
    description: 'The professional title of the Person.',
    required: false,
});

export const personAddress = Property.Json({
    displayName: 'Address',
    description: 'An object containing the street, city, state, postal code, and country of the Person. Example: {"street": "123 Main St", "city": "Anytown", "state": "NY", "postal_code": "12345", "country": "USA"}',
    required: false,
});

export const personEmails = Property.Array({
    displayName: 'Emails',
    description: 'An array of email addresses for the Person. Each email address must be unique across all People records. Example category: "work" or "home".',
    required: false,
    properties: {
        email: Property.ShortText({
            displayName: 'Email Address',
            required: true,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'The category of the email address (e.g., "work", "home").',
            required: false,
            defaultValue: 'work',
        }),
    },
    defaultValue: [],
});

export const personPhoneNumbers = Property.Array({
    displayName: 'Phone Numbers',
    description: 'An array of phone numbers for the Person. Example categories: "mobile", "work", or "home".',
    required: false,
    properties: {
        number: Property.ShortText({
            displayName: 'Phone Number',
            required: true,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'The category of the phone number (e.g., "mobile", "work", "home").',
            required: false,
            defaultValue: 'mobile',
        }),
    },
    defaultValue: [],
});

export const personSocials = Property.Array({
    displayName: 'Social Profiles',
    description: 'An array of social profiles for the Person, each with a URL and an optional category.',
    required: false,
    properties: {
        url: Property.ShortText({
            displayName: 'URL',
            required: true,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            required: false,
        }),
    },
    defaultValue: [],
});

export const personWebsites = Property.Array({
    displayName: 'Websites',
    description: 'An array of websites for the Person, each with a URL and an optional category.',
    required: false,
    properties: {
        url: Property.ShortText({
            displayName: 'URL',
            required: true,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            required: false,
        }),
    },
    defaultValue: [],
});

export const personCustomFields = Property.Array({
    displayName: 'Custom Fields',
    description: 'An array of custom field values for the Person. Each entry requires a Custom Field Definition ID and a value.',
    required: false,
    properties: {
        custom_field_definition_id: Property.ShortText({
            displayName: 'Custom Field Definition ID',
            description: 'The ID of the Custom Field Definition.',
            required: true,
        }),
        value: Property.Json({
            displayName: 'Value',
            description: 'The value of the custom field (number, string, option ID, or timestamp).',
            required: true,
        }),
    },
    defaultValue: [],
});