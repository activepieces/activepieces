export const enDefault = {
    common: {
        auth: {
            connect: 'Connect to Zoho Campaigns',
            connected: 'Connected',
        },
        error: {
            invalidEmail: 'Please enter a valid email address',
            apiError: 'API request failed: {{message}}',
            rateLimit: 'Rate limit exceeded. Please try again later.',
            auth: 'Authentication failed. Please check your credentials.',
            permission: 'Permission denied. Please check your API access rights.',
            notFound: 'Resource not found. Please check your request parameters.',
        },
    },
    actions: {
        createContact: {
            description: 'Add a new contact or update an existing one',
            props: {
                firstName: 'First name of the contact',
                lastName: 'Last name of the contact',
                email: 'Email address of the contact',
                listKey: 'The key of the mailing list to add the contact to',
                tags: 'Tags to apply to the contact',
                source: 'Source of the contact (e.g., Website, Social Media)',
            },
        },
        createCampaign: {
            description: 'Create a new campaign',
            props: {
                name: 'Name of the campaign',
                subject: 'Email subject line',
                fromName: 'Sender name',
                fromEmail: 'Sender email address',
                content: 'Email content (HTML)',
            },
        },
        // Add other action translations
    },
    triggers: {
        newContact: {
            description: 'Triggers when a new contact is added',
            props: {
                listKey: 'The mailing list to monitor',
            },
        },
        // Add other trigger translations
    },
};
