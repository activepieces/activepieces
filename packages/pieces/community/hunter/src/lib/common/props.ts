import { Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, isRecord } from './client';
import { CLEARABLE_LEAD_FIELDS, hunterRequests } from './requests';

export const campaignIdProp = Property.Dropdown({
    displayName: 'Campaign',
    required: true,
    refreshers: [],
    auth: hunterAuth,
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your Hunter account first.', options: [] };
        }
        try {
            const campaigns = await collectPages({
                fetchPage: async ({ offset }) => {
                    const page = await hunterRequests.listCampaigns({ apiKey: apiKeyOf(auth), query: { limit: 100, offset } });
                    return Array.isArray(page['campaigns']) ? page['campaigns'].filter(isRecord) : [];
                },
                pageSize: 100,
                maxItems: 1000,
            });
            return {
                disabled: false,
                placeholder: campaigns.length === 0 ? 'No campaigns (sequences) found in Hunter.' : undefined,
                options: campaigns.map((campaign) => ({ label: String(campaign['name'] ?? campaign['id']), value: Number(campaign['id']) })),
            };
        } catch (error) {
            return { disabled: true, placeholder: `Could not load campaigns: ${errorText(error)}`, options: [] };
        }
    },
});

export const emailsProp = Property.Array({
    displayName: 'Emails',
    required: false,
    description: 'Email addresses to add as recipients (max 50). At least one email or lead is required.',
    defaultValue: [],
});

export const leadIdsDropdownProp = Property.MultiSelectDropdown({
    displayName: 'Leads',
    required: false,
    auth: hunterAuth,
    description: 'Leads to add as recipients (max 50). Shows your 1000 newest leads.',
    refreshers: [],
    options: async ({ auth }) => leadOptions({ auth }),
});

export const leadsListDropdownProp = Property.Dropdown({
    auth: hunterAuth,
    displayName: 'Leads List',
    required: false,
    description: 'Leads list to use. Leave empty for the default (most recent list).',
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your Hunter account first.', options: [] };
        }
        try {
            const lists = await collectPages({
                fetchPage: async ({ offset }) => {
                    const page = await hunterRequests.listLeadsLists({ apiKey: apiKeyOf(auth), limit: 100, offset });
                    return Array.isArray(page['leads_lists']) ? page['leads_lists'].filter(isRecord) : [];
                },
                pageSize: 100,
                maxItems: 1000,
            });
            return {
                disabled: false,
                options: lists.map((list) => ({ label: `${String(list['name'] ?? list['id'])} (${String(list['leads_count'] ?? 0)} leads)`, value: Number(list['id']) })),
            };
        } catch (error) {
            return { disabled: true, placeholder: `Could not load leads lists: ${errorText(error)}`, options: [] };
        }
    },
});

export const leadSelectDropdownProp = Property.Dropdown({
    auth: hunterAuth,
    displayName: 'Lead',
    required: true,
    description: 'Lead from your Hunter account (your 1000 newest leads are listed).',
    refreshers: [],
    options: async ({ auth }) => leadOptions({ auth }),
});

export const leadDeleteDropdownProp = Property.Dropdown({
    auth: hunterAuth,
    displayName: 'Lead to Delete',
    required: true,
    description: 'Lead to delete (your 1000 newest leads are listed).',
    refreshers: [],
    options: async ({ auth }) => leadOptions({ auth }),
});

export const clearFieldsProp = Property.StaticMultiSelectDropdown({
    displayName: 'Clear Fields',
    required: false,
    description: 'Fields to blank on the lead. A field cannot be both set and cleared.',
    options: {
        options: [...CLEARABLE_LEAD_FIELDS, 'confidence_score'].map((field) => ({ label: field, value: field })),
    },
});

export const domainProp = Property.ShortText({
    displayName: 'Domain',
    required: false,
    description:
        'Company domain, e.g. "stripe.com". At least one of domain or company is required; domain wins when both are set.',
});

export const companyProp = Property.ShortText({
    displayName: 'Company',
    required: false,
    description:
        'Company name, e.g. "Stripe". Used only when no domain is given.',
});

export const emailTypeProp = Property.StaticDropdown({
    displayName: 'Type',
    required: false,
    description: 'Only "personal" or "generic" email addresses. Leave empty for both.',
    options: {
        options: [
            { label: 'Personal', value: 'personal' },
            { label: 'Generic', value: 'generic' },
        ],
    },
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

export const filterProp = ({ name, description }: { name: string; description: string }) =>
    Property.ShortText({ displayName: name, required: false, description });

export const emailFilterProp = filterProp({ name: 'Email', description: 'Filter by email (use "*" for any, "~" for empty, or substring).' });
export const firstNameFilterProp = filterProp({ name: 'First Name', description: 'Filter by first name.' });
export const lastNameFilterProp = filterProp({ name: 'Last Name', description: 'Filter by last name.' });
export const positionFilterProp = filterProp({ name: 'Position', description: 'Filter by position.' });
export const companyFilterProp = filterProp({ name: 'Company', description: 'Filter by company.' });
export const industryFilterProp = filterProp({ name: 'Industry', description: 'Filter by industry.' });
export const websiteFilterProp = filterProp({ name: 'Website', description: 'Filter by website.' });
export const countryCodeFilterProp = filterProp({ name: 'Country Code', description: 'Filter by ISO 3166‑1 alpha‑2 country code.' });
export const companySizeFilterProp = filterProp({ name: 'Company Size', description: 'Filter by company size.' });
export const sourceFilterProp = filterProp({ name: 'Source', description: 'Filter by source.' });
export const twitterFilterProp = filterProp({ name: 'Twitter Handle', description: 'Filter by Twitter handle.' });
export const linkedinUrlFilterProp = filterProp({ name: 'LinkedIn URL', description: 'Filter by LinkedIn URL.' });
export const phoneNumberFilterProp = filterProp({ name: 'Phone Number', description: 'Filter by phone number.' });


export const syncStatusProp = Property.StaticDropdown({
    displayName: 'Sync Status',
    required: false,
    description: 'Filter by synchronization status.',
    options: {
        options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Error', value: 'error' },
            { label: 'Success', value: 'success' },
        ],
    },
});

export const arrayStringProp = ({ name, description }: { name: string; description: string }) =>
    Property.Array({
        displayName: name,
        required: false,
        description,
        defaultValue: [],
    });


export const sendingStatusProp = arrayStringProp({ name: 'Sending Status(es)', description: 'Filter by sending status(es): clicked, opened, sent, pending, error, bounced, unsubscribed, replied, or "~" (unset).' });
export const verificationStatusProp = arrayStringProp({ name: 'Verification Status(es)', description: 'Filter by verification status(es): accept_all, disposable, invalid, unknown, valid, webmail, or "pending".' });

export const lastActivityAtFilterProp = filterProp({ name: 'Last Activity Date', description: 'Use "*" for any value or "~" for unset.' });
export const lastContactedAtFilterProp = filterProp({ name: 'Last Contacted Date', description: 'Use "*" for any value or "~" for unset.' });

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

async function leadOptions({ auth }: { auth: unknown }) {
    if (!auth) {
        return { disabled: true, placeholder: 'Connect your Hunter account first.', options: [] };
    }
    try {
        const leads = await collectPages({
            fetchPage: async ({ offset }) => hunterRequests.listLeadsPage({ apiKey: apiKeyOf(auth), limit: 1000, offset }),
            pageSize: 1000,
            maxItems: 1000,
        });
        return {
            disabled: false,
            options: leads.map((lead) => ({
                label: `${[lead['first_name'], lead['last_name']].filter((part) => typeof part === 'string' && part !== '').join(' ')} (${String(lead['email'])})`.trim(),
                value: Number(lead['id']),
            })),
        };
    } catch (error) {
        return { disabled: true, placeholder: `Could not load leads: ${errorText(error)}`, options: [] };
    }
}

async function collectPages({ fetchPage, pageSize, maxItems }: { fetchPage: (params: { offset: number }) => Promise<Record<string, unknown>[]>; pageSize: number; maxItems: number }) {
    const items: Record<string, unknown>[] = [];
    for (let offset = 0; offset < maxItems; offset += pageSize) {
        const page = await fetchPage({ offset });
        items.push(...page);
        if (page.length < pageSize) {
            break;
        }
    }
    return items.slice(0, maxItems);
}

function errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
