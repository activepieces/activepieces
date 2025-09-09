import { Property } from '@activepieces/pieces-framework';

export const companyId = Property.Number({
    displayName: 'Company ID',
    description: 'The ID of the company to update.',
    required: true,
})

export const companyName = Property.ShortText({
    displayName: 'Company Name',
    description: 'The name of the Company. This field is required for new Companies.',
    required: true,
});

export const companyEmailDomain = Property.ShortText({
    displayName: 'Email Domain',
    description: 'The domain to which email addresses for the Company belong. This must be unique across all Companies in Copper, as it acts as a unique key.',
    required: false,
});

export const companyDetails = Property.LongText({
    displayName: 'Description',
    description: 'A description or detailed notes about the Company.',
    required: false,
});

export const companyAddressStreet = Property.ShortText({
    displayName: 'Address Street',
    description: 'The street name and number for the Company\'s address.',
    required: false,
});

export const companyAddressCity = Property.ShortText({
    displayName: 'Address City',
    description: 'The city for the Company\'s address.',
    required: false,
});

export const companyAddressState = Property.ShortText({
    displayName: 'Address State/Province',
    description: 'The state or province for the Company\'s address.',
    required: false,
});

export const companyAddressPostalCode = Property.ShortText({
    displayName: 'Address Postal Code',
    description: 'The postal code for the Company\'s address.',
    required: false,
});

export const companyAddressCountry = Property.ShortText({
    displayName: 'Address Country',
    description: 'The country for the Company\'s address (e.g., "United States").',
    required: false,
});

export const companyAssigneeId = Property.Number({
    displayName: 'Assignee User ID',
    description: 'The unique identifier of the User who owns this Company.',
    required: false,
});

export const companyContactTypeId = Property.Number({
    displayName: 'Contact Type ID',
    description: 'The unique identifier of the Contact Type associated with this Company.',
    required: false,
});

export const companyPrimaryContactId = Property.Number({
    displayName: 'Primary Contact Person ID',
    description: 'The unique identifier of the Person who is the primary contact for this Company.',
    required: false,
});

export const companyPhoneNumbers = Property.Array({
    displayName: 'Phone Numbers',
    description: 'An array of phone numbers associated with the Company. Each entry requires a number and a category (e.g., "work", "mobile").',
    required: false,
    properties: {
        number: Property.ShortText({
            displayName: 'Phone Number',
            description: 'The phone number string (e.g., "415-123-45678").',
            required: true,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'The category of the phone number (e.g., "work", "mobile", "fax").',
            required: true,
        }),
    },
});

export const companySocials = Property.Array({
    displayName: 'Social Profiles',
    description: 'An array of social media profiles for the Company. Each entry requires a URL and a category (e.g., "linkedin", "twitter").',
    required: false,
    properties: {
        url: Property.ShortText({
            displayName: 'Social URL',
            description: 'The URL of the social profile.',
            required: true,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'The category of the social profile.',
            required: true,
        }),
    },
});

export const companyWebsites = Property.Array({
    displayName: 'Websites',
    description: 'An array of websites belonging to the Company. Each entry requires a URL and a category (e.g., "main", "blog").',
    required: false,
    properties: {
        url: Property.ShortText({
            displayName: 'Website URL',
            description: 'The URL of the website.',
            required: true,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'The category of the website.',
            required: true,
        }),
    },
});

export const companyTags = Property.Array({
    displayName: 'Tags',
    description: 'An array of tags (strings) associated with the Company.',
    required: false,
});

export const companyCustomFields = Property.Array({
    displayName: 'Custom Fields',
    description: 'An array of custom field values for the Company. Each entry requires a custom field definition ID and a value.',
    required: false,
    properties: {
        custom_field_definition_id: Property.Number({
            displayName: 'Custom Field Definition ID',
            description: 'The ID of the Custom Field Definition.',
            required: true,
        }),
        value: Property.ShortText({
            displayName: 'Value',
            description: 'The value for the custom field. This can be a number, string, option ID, or timestamp depending on the custom field type.',
            required: true,
        }),
    },
});