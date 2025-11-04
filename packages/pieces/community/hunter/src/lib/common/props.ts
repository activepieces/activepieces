import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from './index';

export const campaignIdProp = Property.Dropdown({
    displayName: 'Campaign',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Hunter account first.',
                options: [],
            };
        }
        const resp = await hunterApiCall({
            apiKey: auth as string,
            endpoint: '/campaigns',
            method: HttpMethod.GET,
        });
        const campaigns = (resp as any).data?.campaigns as Array<{
            id: number;
            name: string;
        }>;

        return {
            disabled: false,
            options: campaigns.map((c) => ({
                label: c.name,
                value: c.id,
            })),
        };
    },
});


export const emailsProp = Property.Array({
    displayName: 'Emails',
    required: false,
    description: 'Email addresses to add as recipients. At least one email or lead ID is required.',
    defaultValue: [],
});

export const leadIdsProp = Property.Array({
    displayName: 'Lead IDs',
    required: false,
    description: 'Existing lead IDs from your Hunter account to add as recipients.',
    defaultValue: [],
});

export const leadIdsDropdownProp = Property.MultiSelectDropdown({
    displayName: 'Leads',
    required: false,
    description: 'Select leads from your Hunter account to add as recipients.',
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Hunter account first.',
                options: [],
            };
        }
        
        const resp = await hunterApiCall({
            apiKey: auth as string,
            endpoint: '/leads',
            method: HttpMethod.GET,
            qparams: { limit: '100' }
        });
        
        const leads = (resp as any).data?.leads || [];
        return {
            disabled: false,
            options: leads.map((lead: any) => ({
                label: `${lead.first_name || ''} ${lead.last_name || ''} (${lead.email})`.trim(),
                value: lead.id
            }))
        };
    }
});

export const domainProp = Property.ShortText({
    displayName: 'Domain',
    required: false,
    description:
        'Domain name to count addresses for (e.g., "stripe.com"). At least one of domain or company is required.',
});

export const companyProp = Property.ShortText({
    displayName: 'Company',
    required: false,
    description:
        'Company name to count addresses for (e.g., "Stripe"). At least one of domain or company is required.',
});

export const companyLeadProp = Property.ShortText({
    displayName: 'Company',
    required: false,
    description: 'Name of the company the lead is working in.',
});

export const emailTypeProp = Property.Dropdown({
    displayName: 'Type',
    required: false,
    description:
        'Count only "personal" or "generic" email addresses. Leave blank for both.',
    options: async () => ({
        disabled: false,

        options: [
            { label: 'Personal', value: 'personal' },
            { label: 'Generic', value: 'generic' },
        ],
    }),
    refreshers: []
});

export const emailProp = Property.ShortText({
    displayName: 'Email',
    required: true,
    description: 'The email address of the lead.',
});

export const firstNameProp = Property.ShortText({
    displayName: 'First Name',
    required: false,
});

export const lastNameProp = Property.ShortText({
    displayName: 'Last Name',
    required: false,
});

export const positionProp = Property.ShortText({
    displayName: 'Position',
    required: false,
});

export const companyIndustryProp = Property.ShortText({
    displayName: 'Company Industry',
    required: false,
    description:
        'Sector of the company (e.g. Finance, Technology, Education, etc.).',
});

export const companySizeProp = Property.ShortText({
    displayName: 'Company Size',
    required: false,
    description: 'Size of the company (e.g. 1-10, 201-500 employees).',
});

export const confidenceScoreProp = Property.Number({
    displayName: 'Confidence Score',
    required: false,
    description:
        'Probability the email is correct (0–100).',
});

export const websiteProp = Property.ShortText({
    displayName: 'Website',
    required: false,
    description: 'Domain name of the company.',
});

export const countryCodeProp = Property.ShortText({
    displayName: 'Country Code',
    required: false,
    description: 'ISO 3166-1 alpha-2 country code.',
});

export const linkedinUrlProp = Property.ShortText({
    displayName: 'LinkedIn URL',
    required: false,
});

export const phoneNumberProp = Property.ShortText({
    displayName: 'Phone Number',
    required: false,
});

export const twitterProp = Property.ShortText({
    displayName: 'Twitter Handle',
    required: false,
});

export const notesProp = Property.ShortText({
    displayName: 'Notes',
    required: false,
    description: 'Personal notes about the lead.',
});

export const sourceProp = Property.ShortText({
    displayName: 'Source',
    required: false,
    description: 'Origin where the lead was found.',
});

export const leadsListIdProp = Property.Number({
    displayName: 'Leads List ID',
    required: false,
    description:
        'ID of the list to add the lead to; defaults to your most recent list.',
});

export const leadsListIdsProp = Property.Array({
    displayName: 'Leads List IDs',
    required: false,
    description:
        'Array of list IDs to add the lead to; defaults to your most recent list.',
    defaultValue: [],
});

export const leadsListDropdownProp = Property.Dropdown({
    displayName: 'Leads List',
    required: false,
    description: 'Select which list to add the lead to; defaults to your most recent list.',
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Hunter account first.',
                options: [],
            };
        }
        
        const resp = await hunterApiCall({
            apiKey: auth as string,
            endpoint: '/leads',
            method: HttpMethod.GET,
            qparams: { limit: '100' }
        });
        
        const leads = (resp as any).data?.leads || [];
        const uniqueLists = new Map();
        
        leads.forEach((lead: any) => {
            if (lead.leads_list) {
                uniqueLists.set(lead.leads_list.id, lead.leads_list);
            }
        });
        
        return {
            disabled: false,
            options: Array.from(uniqueLists.values()).map((list: any) => ({
                label: `${list.name} (${list.leads_count} leads)`,
                value: list.id
            }))
        };
    }
});

export const customAttributesProp = Property.Json({
    displayName: 'Custom Attributes',
    required: false,
    description:
        'Key/value map of any custom attributes, e.g. { "customer_id": "cus-1234abcd" }.',
});

export const leadIdProp = Property.Number({
    displayName: 'Lead ID',
    required: true,
    description: 'Identifier of the lead to delete.',
});

export const leadSelectDropdownProp = Property.Dropdown({
    displayName: 'Lead',
    required: true,
    description: 'Select a lead from your Hunter account.',
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Hunter account first.',
                options: [],
            };
        }
        
        const resp = await hunterApiCall({
            apiKey: auth as string,
            endpoint: '/leads',
            method: HttpMethod.GET,
            qparams: { limit: '100' }
        });
        
        const leads = (resp as any).data?.leads || [];
        return {
            disabled: false,
            options: leads.map((lead: any) => ({
                label: `${lead.first_name || ''} ${lead.last_name || ''} (${lead.email})`.trim(),
                value: lead.id
            }))
        };
    }
});

export const leadDeleteDropdownProp = Property.Dropdown({
    displayName: 'Lead to Delete',
    required: true,
    description: 'Select the lead to delete from your Hunter account.',
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Hunter account first.',
                options: [],
            };
        }
        
        const resp = await hunterApiCall({
            apiKey: auth as string,
            endpoint: '/leads',
            method: HttpMethod.GET,
            qparams: { limit: '100' }
        });
        
        const leads = (resp as any).data?.leads || [];
        return {
            disabled: false,
            options: leads.map((lead: any) => ({
                label: `${lead.first_name || ''} ${lead.last_name || ''} (${lead.email})`.trim(),
                value: lead.id
            }))
        };
    }
});

export const fullNameProp = Property.ShortText({
    displayName: 'Full Name',
    required: false,
    description:
        "The person's full name (if you can't supply both first and last name).",
});

export const maxDurationProp = Property.Number({
    displayName: 'Max Duration (seconds)',
    required: false,
    description:
        'How long Hunter should spend refining results (3-20, default 10).',
});

export const filterProp = (name: string, description: string) =>
    Property.ShortText({ displayName: name, required: false, description });

export const emailFilterProp = filterProp(
    'Email',
    'Filter by email (use "*" for any, "~" for empty, or substring).'
);
export const firstNameFilterProp = filterProp(
    'First Name',
    'Filter by first name.'
);
export const lastNameFilterProp = filterProp(
    'Last Name',
    'Filter by last name.'
);
export const positionFilterProp = filterProp(
    'Position',
    'Filter by position.'
);
export const companyFilterProp = filterProp(
    'Company',
    'Filter by company.'
);
export const industryFilterProp = filterProp(
    'Industry',
    'Filter by industry.'
);
export const websiteFilterProp = filterProp(
    'Website',
    'Filter by website.'
);
export const countryCodeFilterProp = filterProp(
    'Country Code',
    'Filter by ISO 3166‑1 alpha‑2 country code.'
);
export const companySizeFilterProp = filterProp(
    'Company Size',
    'Filter by company size.'
);
export const sourceFilterProp = filterProp(
    'Source',
    'Filter by source.'
);
export const twitterFilterProp = filterProp(
    'Twitter Handle',
    'Filter by Twitter handle.'
);
export const linkedinUrlFilterProp = filterProp(
    'LinkedIn URL',
    'Filter by LinkedIn URL.'
);
export const phoneNumberFilterProp = filterProp(
    'Phone Number',
    'Filter by phone number.'
);


export const syncStatusProp = Property.Dropdown({
    displayName: 'Sync Status',
    required: false,
    description: 'Filter by synchronization status.',
    options: async () => ({
        disabled: false,
        options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Error', value: 'error' },
            { label: 'Success', value: 'success' },
        ],
    }),
    refreshers: []
});

export const arrayStringProp = (name: string, description: string) =>
    Property.Array({
        displayName: name,
        required: false,
        description,
        defaultValue: [],
    });


export const sendingStatusProp = arrayStringProp(
    'Sending Status(es)',
    'Filter by sending status(es): clicked, opened, sent, pending, error, bounced, unsubscribed, replied, or "~" (unset).'
);
export const verificationStatusProp = arrayStringProp(
    'Verification Status(es)',
    'Filter by verification status(es): accept_all, disposable, invalid, unknown, valid, webmail, or "pending".'
);

export const dateFilterProp = filterProp(
    'Activity/Contact Date',
    'Use "*" for any value or "~" for unset.'
);

export const customAttributesFilterProp = Property.Json({
    displayName: 'Custom Attributes Filter',
    required: false,
    description:
        'JSON object of slug→filterValue (use "*", "~", or substrings).',
});

export const queryProp = Property.ShortText({
    displayName: 'Query',
    required: false,
    description:
        'Search first_name, last_name or email containing this substring.',
});

export const limitProp = Property.Number({
    displayName: 'Limit',
    required: false,
    description: 'Max leads to return (1-1000). Defaults to 20.',
});

export const offsetProp = Property.Number({
    displayName: 'Offset',
    required: false,
    description: 'Number of leads to skip (0-100000). Defaults to 0.',
});
