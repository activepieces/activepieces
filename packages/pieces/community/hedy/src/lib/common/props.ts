import { Property } from '@activepieces/pieces-framework';

export const commonProps = {
  sessionId: Property.ShortText({
    displayName: 'Session ID',
    description: 'The session ID as shown in the Hedy dashboard.',
    required: true,
  }),

  highlightId: Property.ShortText({
    displayName: 'Highlight ID',
    description: 'The highlight ID as shown in the Hedy dashboard.',
    required: true,
  }),

  topicId: Property.ShortText({
    displayName: 'Topic ID',
    description: 'The topic ID as shown in the Hedy dashboard.',
    required: true,
  }),

  returnAll: Property.Checkbox({
    displayName: 'Return All',
    description: 'Return all results instead of using the limit.',
    required: false,
    defaultValue: false,
  }),

  limit: Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of results to return (default 50).',
    required: false,
    defaultValue: 50,
  }),

  format: Property.StaticDropdown({
    displayName: 'Response Format',
    description: 'Select the response format to use.',
    required: false,
    defaultValue: 'standard',
    options: {
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Zapier Compatible', value: 'zapier' },
      ],
    },
  }),

  afterCursor: Property.ShortText({
    displayName: 'After Cursor',
    description: 'Pagination cursor used to fetch results after a specific item.',
    required: false,
  }),

  beforeCursor: Property.ShortText({
    displayName: 'Before Cursor',
    description: 'Pagination cursor used to fetch results before a specific item.',
    required: false,
  }),
};
