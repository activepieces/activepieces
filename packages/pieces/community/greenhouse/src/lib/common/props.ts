import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { compactObject, makeRequest } from './index';

type GreenhouseUser = {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type GreenhouseCandidate = {
  id: number;
  first_name?: string;
  last_name?: string;
  company?: string;
};

type GreenhouseJob = {
  id: number;
  name?: string;
  requisition_id?: string | null;
};

type ValueAndType = {
  value: string;
  type?: string;
};

type EducationInput = {
  school_name?: string;
  degree_name?: string;
  discipline?: string;
  start_date?: string;
  end_date?: string;
};

type EmploymentInput = {
  company_name?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
};

function getUserLabel(user: GreenhouseUser): string {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return user.name || fullName || user.email || `User ${user.id}`;
}

function getCandidateLabel(candidate: GreenhouseCandidate): string {
  const fullName = [candidate.first_name, candidate.last_name]
    .filter(Boolean)
    .join(' ');
  return fullName || candidate.company || `Candidate ${candidate.id}`;
}

function getJobLabel(job: GreenhouseJob): string {
  return `${job.name ?? `Job ${job.id}`}${job.requisition_id ? ` · ${job.requisition_id}` : ''}`;
}

export const userIdProp = Property.Dropdown({
  displayName: 'User',
  description:
    'Greenhouse internal user ID to send in the On-Behalf-Of header for write operations.',
  required: true,
  auth: greenhouseAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Greenhouse account first.',
        options: [],
      };
    }

    const users = await makeRequest<GreenhouseUser[]>(auth, {
      method: HttpMethod.GET,
      path: '/users',
      queryParams: {
        per_page: '100',
      },
    });

    return {
      disabled: false,
      options: (users ?? []).map((user) => ({
        label: getUserLabel(user),
        value: user.id,
      })),
    };
  },
});

export const candidateIdProp = Property.Dropdown({
  displayName: 'Candidate',
  description: 'Candidate or prospect ID to target.',
  required: true,
  auth: greenhouseAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Greenhouse account first.',
        options: [],
      };
    }

    const candidates = await makeRequest<GreenhouseCandidate[]>(auth, {
      method: HttpMethod.GET,
      path: '/candidates',
      queryParams: {
        per_page: '100',
        skip_count: 'true',
      },
    });

    return {
      disabled: false,
      options: (candidates ?? []).map((candidate) => ({
        label: getCandidateLabel(candidate),
        value: candidate.id,
      })),
    };
  },
});

export const jobIdProp = Property.Dropdown({
  displayName: 'Job',
  description: 'Greenhouse job to attach to the new candidate application.',
  required: true,
  auth: greenhouseAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Greenhouse account first.',
        options: [],
      };
    }

    const jobs = await makeRequest<GreenhouseJob[]>(auth, {
      method: HttpMethod.GET,
      path: '/jobs',
      queryParams: {
        per_page: '100',
        skip_count: 'true',
      },
    });

    return {
      disabled: false,
      options: (jobs ?? []).map((job) => ({
        label: getJobLabel(job),
        value: job.id,
      })),
    };
  },
});

export const jobIdsProp = Property.MultiSelectDropdown({
  displayName: 'Jobs',
  description:
    'Optional Greenhouse jobs to attach to the new prospect. Greenhouse prospects can be created jobless.',
  required: false,
  auth: greenhouseAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Greenhouse account first.',
        options: [],
      };
    }

    const jobs = await makeRequest<GreenhouseJob[]>(auth, {
      method: HttpMethod.GET,
      path: '/jobs',
      queryParams: {
        per_page: '100',
        skip_count: 'true',
      },
    });

    return {
      disabled: false,
      options: (jobs ?? []).map((job) => ({
        label: getJobLabel(job),
        value: job.id,
      })),
    };
  },
});

export const emailAddressesProp = Property.Array({
  displayName: 'Email Addresses',
  description: 'At least one email address is required.',
  required: true,
  properties: {
    value: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'Personal', value: 'personal' },
          { label: 'Work', value: 'work' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
  },
});

export const commonPersonProps = {
  userId: userIdProp,
  firstName: Property.ShortText({
    displayName: 'First Name',
    required: true,
  }),
  lastName: Property.ShortText({
    displayName: 'Last Name',
    required: true,
  }),
  emailAddresses: emailAddressesProp,
  company: Property.ShortText({
    displayName: 'Company',
    required: false,
  }),
  title: Property.ShortText({
    displayName: 'Title',
    required: false,
  }),
  phoneNumbers: Property.Array({
    displayName: 'Phone Numbers',
    description: 'Phone numbers, preferably in E.164 format.',
    required: false,
    properties: {
      value: Property.ShortText({
        displayName: 'Phone Number',
        required: true,
      }),
      type: Property.ShortText({
        displayName: 'Type',
        required: false,
      }),
    },
  }),
  websiteAddresses: Property.Array({
    displayName: 'Website Addresses',
    required: false,
    properties: {
      value: Property.ShortText({
        displayName: 'Website URL',
        required: true,
      }),
      type: Property.ShortText({
        displayName: 'Type',
        required: false,
      }),
    },
  }),
  socialMediaAddresses: Property.Array({
    displayName: 'Social Media Addresses',
    required: false,
    properties: {
      value: Property.ShortText({
        displayName: 'Profile URL',
        required: true,
      }),
      type: Property.ShortText({
        displayName: 'Type',
        required: false,
      }),
    },
  }),
  tags: Property.Array({
    displayName: 'Tags',
    required: false,
  }),
  educations: Property.Array({
    displayName: 'Educations',
    required: false,
    properties: {
      school_name: Property.ShortText({
        displayName: 'School Name',
        required: false,
      }),
      degree_name: Property.ShortText({
        displayName: 'Degree Name',
        required: false,
      }),
      discipline: Property.ShortText({
        displayName: 'Discipline',
        required: false,
      }),
      start_date: Property.ShortText({
        displayName: 'Start Date',
        description: 'ISO-8601 date/time string.',
        required: false,
      }),
      end_date: Property.ShortText({
        displayName: 'End Date',
        description: 'ISO-8601 date/time string.',
        required: false,
      }),
    },
  }),
  employments: Property.Array({
    displayName: 'Employments',
    required: false,
    properties: {
      company_name: Property.ShortText({
        displayName: 'Company Name',
        required: false,
      }),
      title: Property.ShortText({
        displayName: 'Title',
        required: false,
      }),
      start_date: Property.ShortText({
        displayName: 'Start Date',
        description: 'ISO-8601 date/time string.',
        required: false,
      }),
      end_date: Property.ShortText({
        displayName: 'End Date',
        description: 'ISO-8601 date/time string.',
        required: false,
      }),
    },
  }),
};

export function buildCommonPersonBody(propsValue: {
  firstName: string;
  lastName: string;
  emailAddresses?: unknown;
  company?: string;
  title?: string;
  phoneNumbers?: unknown;
  websiteAddresses?: unknown;
  socialMediaAddresses?: unknown;
  tags?: unknown;
  educations?: unknown;
  employments?: unknown;
}): Record<string, unknown> {
  const emails = (propsValue.emailAddresses ?? []) as ValueAndType[];
  const phones = (propsValue.phoneNumbers ?? []) as ValueAndType[];
  const websites = (propsValue.websiteAddresses ?? []) as ValueAndType[];
  const socials = (propsValue.socialMediaAddresses ?? []) as ValueAndType[];
  const tags = (propsValue.tags ?? []) as Array<string | { value?: string }>;
  const educations = (propsValue.educations ?? []) as EducationInput[];
  const employments = (propsValue.employments ?? []) as EmploymentInput[];

  return compactObject({
    first_name: propsValue.firstName,
    last_name: propsValue.lastName,
    email_addresses: emails.map((email) =>
      compactObject({
        value: email.value,
        type: email.type,
      }),
    ),
    company: propsValue.company,
    title: propsValue.title,
    phone_numbers: phones.map((phone) =>
      compactObject({
        value: phone.value,
        type: phone.type,
      }),
    ),
    website_addresses: websites.map((website) =>
      compactObject({
        value: website.value,
        type: website.type,
      }),
    ),
    social_media_addresses: socials.map((social) =>
      compactObject({
        value: social.value,
        type: social.type,
      }),
    ),
    tags: tags
      .map((tag) => (typeof tag === 'string' ? tag : tag.value))
      .filter((tag): tag is string => Boolean(tag)),
    educations: educations.map((education) => compactObject(education)),
    employments: employments.map((employment) => compactObject(employment)),
  });
}
