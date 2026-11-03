import { Property } from '@activepieces/pieces-framework';
export const props = {
  limit: Property.Number({
    displayName: 'Limit',
    required: false,
    description: 'Most transcripts to return, up to 200.',
    defaultValue: 10,
  }),
  status: Property.StaticDropdown({
    displayName: 'Status',
    required: false,
    description: 'Only transcripts with this status.',
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
    description: 'Only transcripts created on this date.',
  }),
  before_id: Property.ShortText({
    displayName: 'Created Before',
    required: false,
    description: 'Only transcripts created before this transcript ID.',
    width: 'half',
    placeholder: 'Transcript ID',
  }),
  after_id: Property.ShortText({
    displayName: 'Created After',
    required: false,
    description: 'Only transcripts created after this transcript ID.',
    width: 'half',
    placeholder: 'Transcript ID',
  }),
  throttled_only: Property.Checkbox({
    displayName: 'Throttled Only',
    required: false,
    description: 'Only throttled transcripts. Ignores the status filter.',
    defaultValue: false,
  }),
};
