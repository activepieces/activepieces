import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { teamDropdown } from '../common/props';

type StreakOrganization = {
  key: string;
  name?: string;
  domains?: string[];
  industry?: string;
  employeeCount?: number;
  phoneNumbers?: string[];
  addresses?: string[];
  twitterHandle?: string;
  facebookHandle?: string;
  linkedinHandle?: string;
  logoURL?: string;
  description?: string;
  creationDate?: number;
  lastSavedTimestamp?: number;
};

export const createOrganizationAction = createAction({
  auth: streakAuth,
  name: 'create_organization',
  displayName: 'Create or Find Organization',
  description:
    'Create an organization in a team. If an organization with the same domain already exists, return that organization instead of creating a duplicate.',
  props: {
    teamKey: teamDropdown,
    name: Property.ShortText({
      displayName: 'Organization Name',
      description:
        'The company name. Required unless a domain is provided (at least one of name or domains must be set).',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      description:
        'Website domains for this organization (e.g. "acme.com"). Used to match existing organizations.',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      required: false,
    }),
    employeeCount: Property.Number({
      displayName: 'Employee Count',
      required: false,
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    const {
      teamKey,
      name,
      domains,
      industry,
      employeeCount,
      phoneNumbers,
      addresses,
      description,
    } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (domains && domains.length > 0) body['domains'] = domains;
    if (industry) body['industry'] = industry;
    if (employeeCount !== undefined && employeeCount !== null) {
      body['employeeCount'] = employeeCount;
    }
    if (phoneNumbers && phoneNumbers.length > 0) body['phoneNumbers'] = phoneNumbers;
    if (addresses && addresses.length > 0) body['addresses'] = addresses;
    if (description) body['description'] = description;

    const response = await streakApiCall<StreakOrganization>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/api/v2/teams/${teamKey}/organizations`,
      queryParams: { getIfExisting: 'true' },
      contentType: 'application/json',
      body,
    });

    const org = response.body;
    return {
      organization_key: org.key,
      name: org.name ?? null,
      domains: Array.isArray(org.domains) ? org.domains.join(', ') : null,
      industry: org.industry ?? null,
      employee_count: org.employeeCount ?? null,
      phone_numbers: Array.isArray(org.phoneNumbers)
        ? org.phoneNumbers.join(', ')
        : null,
      addresses: Array.isArray(org.addresses) ? org.addresses.join(', ') : null,
      twitter_handle: org.twitterHandle ?? null,
      facebook_handle: org.facebookHandle ?? null,
      linkedin_handle: org.linkedinHandle ?? null,
      logo_url: org.logoURL ?? null,
      description: org.description ?? null,
      creation_date_epoch_ms: org.creationDate ?? null,
      last_saved_timestamp_epoch_ms: org.lastSavedTimestamp ?? null,
    };
  },
});
