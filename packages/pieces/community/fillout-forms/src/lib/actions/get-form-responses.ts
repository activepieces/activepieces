import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { formIdDropdown } from '../common/props';
import { filloutFormsAuth } from '../auth';
import { getFormResponsesActionOutputSchema } from '../output-schemas';

export const getFormResponses = createAction({
  auth: filloutFormsAuth,
  name: 'getFormResponses',
  classification: 'SEARCH',
  displayName: 'Get Form Responses',
  description: 'Lists responses to a form, with optional filters.',
  audience: 'both',
  aiMetadata: { description: 'Lists submissions for a specific Fillout form (identified by form ID), optionally narrowed by date range, search text, completion status (finished by default, or in-progress), sort order, limit, and offset for pagination. With no filters it returns all submissions; supply filters to fetch only matching ones. Use to retrieve or page through collected form responses. Read-only and idempotent.', idempotent: true },
  outputSchema: getFormResponsesActionOutputSchema,
  propertyGroups: [
    { key: 'form', display: 'section', label: 'Search in', icon: 'file', props: ['formId'] },
    { key: 'filters', display: 'section', label: 'Filters', icon: 'filter', props: ['search', 'afterDate', 'beforeDate', 'status', 'includePreview'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['sort', 'limit', 'offset'] },
  ],
  props: {
    formId: formIdDropdown,
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      description: 'Only responses containing this text.',
      placeholder: 'e.g. john@example.com',
    }),
    afterDate: Property.DateTime({
      displayName: 'Submitted After',
      required: false,
      width: 'half',
    }),
    beforeDate: Property.DateTime({
      displayName: 'Submitted Before',
      required: false,
      width: 'half',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'In Progress', value: 'in_progress' }
        ]
      },
      description: 'Empty: finished only. In Progress needs a Fillout Business plan.'
    }),
    includePreview: Property.Checkbox({
      displayName: 'Include Preview Responses',
      required: false,
      description: 'Also return test responses from preview mode.'
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      options: {
        options: [
          { label: 'Oldest First', value: 'asc' },
          { label: 'Newest First', value: 'desc' }
        ]
      },
      description: 'Empty: oldest first.'
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      width: 'half',
      description: 'Responses to return, 1 to 150. Empty: 50.'
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      width: 'half',
      description: 'Responses to skip, for paging.'
    }),
    includeEditLink: Property.Checkbox({
      displayName: 'Include Edit Link',
      required: false,
      advanced: true,
      description: 'Adds a link where the answers can be edited.'
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const { formId, ...filters } = context.propsValue;

    const queryParams: Record<string, string> = Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => !isNil(value) && value !== '')
        .map(([key, value]) => [key, String(value)])
    );

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/submissions`,
      queryParams
    );

    return response;
  },
});
