import { Property } from '@activepieces/pieces-framework';
export const props = {
  limit: Property.Number({
    displayName: 'Limit',
    required: false,
    description: 'Maximum amount of transcripts to retrieve',
  }),
  status: Property.StaticDropdown({
    displayName: 'Status',
    required: false,
    description: 'Filter by transcript status',
    options: {
      options: [
        {
          label: 'Queued',
          value: 'queued',
        },
        {
          label: 'Processing',
          value: 'processing',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Error',
          value: 'error',
        },
      ],
    },
  }),
  created_on: Property.DateTime({
    displayName: 'Created On',
    required: false,
    description: 'Only get transcripts created on this date',
  }),
  before_id: Property.ShortText({
    displayName: 'Before ID',
    required: false,
    description: 'Get transcripts that were created before this transcript ID',
  }),
  after_id: Property.ShortText({
    displayName: 'After ID',
    required: false,
    description: 'Get transcripts that were created after this transcript ID',
  }),
  throttled_only: Property.Checkbox({
    displayName: 'Throttled Only',
    required: false,
    description: 'Only get throttled transcripts, overrides the status filter',
    defaultValue: false,
  }),
};
