import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { createWorkableClient, cursorFromPaging, encodeId, WorkableClient } from './client';
import { workableValues } from './values';

const v = workableValues;

export const accountSubdomainProp = Property.ShortText({
  displayName: 'Account Subdomain',
  description:
    'Only needed when your token can see several Workable accounts. Enter the subdomain, for example "acme" for acme.workable.com. Empty uses the first account.',
  required: false,
});

export async function fetchAllPages({
  client,
  path,
  key,
  query = {},
}: {
  client: WorkableClient;
  path: string;
  key: string;
  query?: Record<string, string | number | undefined>;
}): Promise<{ items: Record<string, unknown>[]; truncated: boolean }> {
  const subdomain = await client.getSubdomain();
  const items: Record<string, unknown>[] = [];
  let sinceId: string | null = null;
  for (let page = 0; page < MAX_DROPDOWN_PAGES; page++) {
    const body = await client.request({ method: HttpMethod.GET, path, query: { ...query, limit: 100, since_id: sinceId ?? undefined } });
    items.push(...v.records(v.rec(body)[key]));
    sinceId = cursorFromPaging({ subdomain, body });
    if (sinceId === null) {
      return { items, truncated: false };
    }
  }
  return { items, truncated: true };
}

function failure(error: unknown) {
  return {
    disabled: true,
    placeholder: error instanceof Error ? `Could not load from Workable: ${error.message}`.slice(0, 300) : 'Could not load from Workable.',
    options: [],
  };
}

const notConnected = { disabled: true, placeholder: 'Connect your Workable account first.', options: [] };

export function jobDropdown({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.Dropdown({
    auth: workableAuth,
    displayName,
    description,
    required,
    refreshers: ['account_subdomain'],
    options: async ({ auth, account_subdomain }) => {
      if (!auth) {
        return notConnected;
      }
      try {
        const client = createWorkableClient({ auth, subdomain: account_subdomain });
        const { items, truncated } = await fetchAllPages({ client, path: '/jobs', key: 'jobs' });
        const options = items
          .filter((job) => v.str(job['shortcode']) !== null)
          .map((job) => {
            const shortcode = v.str(job['shortcode']) ?? '';
            const state = v.str(job['state']);
            return {
              label: `${v.str(job['title']) ?? shortcode} (${shortcode}${state ? `, ${state}` : ''})`,
              value: shortcode,
            };
          });
        return {
          disabled: false,
          options,
          placeholder: truncated ? 'Showing the first 5,000 jobs. Use the AI version or Custom API Call for others.' : undefined,
        };
      } catch (error) {
        return failure(error);
      }
    },
  });
}

export function stageDropdown({ required, description }: { required: boolean; description: string }) {
  return Property.Dropdown({
    auth: workableAuth,
    displayName: 'Stage',
    description,
    required,
    refreshers: ['account_subdomain', 'job'],
    options: async ({ auth, account_subdomain, job }) => {
      if (!auth) {
        return notConnected;
      }
      if (typeof job !== 'string' || job.length === 0) {
        return { disabled: true, placeholder: 'Select a job first.', options: [] };
      }
      try {
        const client = createWorkableClient({ auth, subdomain: account_subdomain });
        const body = await client.request({ method: HttpMethod.GET, path: `/jobs/${encodeId({ value: job, label: 'Job' })}/stages` });
        return {
          disabled: false,
          options: v
            .records(v.rec(body)['stages'])
            .filter((stage) => v.str(stage['slug']) !== null)
            .map((stage) => ({ label: v.str(stage['name']) ?? v.str(stage['slug']) ?? '', value: v.str(stage['slug']) ?? '' })),
        };
      } catch (error) {
        return failure(error);
      }
    },
  });
}

export function memberDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    auth: workableAuth,
    displayName: 'Acting Member',
    description,
    required: true,
    refreshers: ['account_subdomain'],
    options: async ({ auth, account_subdomain }) => {
      if (!auth) {
        return notConnected;
      }
      try {
        const client = createWorkableClient({ auth, subdomain: account_subdomain });
        const { items, truncated } = await fetchAllPages({ client, path: '/members', key: 'members' });
        return {
          disabled: false,
          options: items
            .filter((member) => v.str(member['id']) !== null)
            .map((member) => ({
              label: `${v.str(member['name']) ?? v.str(member['id'])}${v.str(member['email']) ? ` <${v.str(member['email'])}>` : ''}`,
              value: v.str(member['id']) ?? '',
            })),
          placeholder: truncated ? 'Showing the first 5,000 members.' : undefined,
        };
      } catch (error) {
        return failure(error);
      }
    },
  });
}

export function memberIdText({ description }: { description: string }) {
  return Property.ShortText({ displayName: 'Acting Member ID', description, required: true });
}

export const candidateIdProp = Property.ShortText({
  displayName: 'Candidate ID',
  description: 'The Workable candidate ID, for example "ce4da98". Find it with List Candidates or in the candidate URL.',
  required: true,
});

const MAX_DROPDOWN_PAGES = 50;

export function candidateFieldProps() {
  return {
    firstname: Property.ShortText({ displayName: 'First Name', required: true }),
    lastname: Property.ShortText({ displayName: 'Last Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'Workable requires an email and refuses a second candidate with the same email on one job.', required: true }),
    headline: Property.ShortText({ displayName: 'Headline', required: false }),
    summary: Property.LongText({ displayName: 'Summary', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    address: Property.ShortText({ displayName: 'Address', required: false }),
    cover_letter: Property.LongText({ displayName: 'Cover Letter', required: false }),
    resume_url: Property.ShortText({ displayName: 'Resume URL', description: 'Public URL of the resume file. Workable downloads it.', required: false }),
    skills: Property.Array({ displayName: 'Skills', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    sourced: Property.Checkbox({
      displayName: 'Sourced',
      description: 'On (default): the candidate is added as sourced and gets no email. Off: added as an applicant, and Workable sends the thank-you email.',
      required: false,
      defaultValue: true,
    }),
  };
}

export function candidateInputFrom(props: Record<string, unknown>) {
  return {
    firstname: props['firstname'],
    lastname: props['lastname'],
    email: props['email'],
    headline: props['headline'],
    summary: props['summary'],
    phone: props['phone'],
    address: props['address'],
    cover_letter: props['cover_letter'],
    resume_url: props['resume_url'],
    skills: props['skills'],
    tags: props['tags'],
  };
}
