import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { greenhouseRequest } from './client';

type GreenhouseJob = {
  id: number;
  name?: string;
  status?: string;
  requisition_id?: string | null;
};

export const jobIdProp = Property.Dropdown({
  displayName: 'Job',
  description: 'Select the Greenhouse job.',
  required: true,
  refreshers: [],
  auth: greenhouseAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Greenhouse account first.',
        options: [],
      };
    }

    const jobs = await greenhouseRequest<GreenhouseJob[]>({
      auth,
      method: HttpMethod.GET,
      path: '/jobs',
      queryParams: {
        per_page: '100',
        skip_count: 'true',
        status: 'open',
      },
    });

    return {
      disabled: false,
      options: (jobs ?? []).map((job) => ({
        label: `${job.name ?? `Job ${job.id}`}${job.requisition_id ? ` · ${job.requisition_id}` : ''}`,
        value: job.id,
      })),
    };
  },
});

export const onBehalfOfProp = Property.Number({
  displayName: 'On-Behalf-Of User ID',
  description:
    'Greenhouse requires the internal user ID issuing write requests for Harvest audit logging.',
  required: true,
});

export const sourceIdProp = Property.Number({
  displayName: 'Source ID',
  description: 'Optional Greenhouse source ID to credit for the application.',
  required: false,
});

export const initialStageIdProp = Property.Number({
  displayName: 'Initial Stage ID',
  description: 'Optional Greenhouse stage ID for the new application.',
  required: false,
});

export const recruiterIdProp = Property.Number({
  displayName: 'Recruiter User ID',
  description: 'Optional Greenhouse recruiter user ID to assign.',
  required: false,
});

export const coordinatorIdProp = Property.Number({
  displayName: 'Coordinator User ID',
  description: 'Optional Greenhouse coordinator user ID to assign.',
  required: false,
});

export const statusProp = Property.StaticDropdown({
  displayName: 'Status',
  description: 'Filter jobs by status.',
  required: false,
  options: {
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
      { label: 'Draft', value: 'draft' },
    ],
  },
});

export const paginationProps = {
  perPage: Property.Number({
    displayName: 'Per Page',
    description: 'Return up to this many jobs (1-500).',
    required: false,
  }),
  page: Property.Number({
    displayName: 'Page Cursor',
    description: 'Pagination cursor / page value returned by Greenhouse.',
    required: false,
  }),
  skipCount: Property.Checkbox({
    displayName: 'Skip Count',
    description: 'Improves performance by omitting total-count work on Greenhouse side.',
    required: false,
    defaultValue: true,
  }),
};
