import { createAction, Property } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';
import { formioProps } from '../common/props';
import { findSubmissionsOutputSchema } from '../common/output-schemas';

function buildQueryParams({
  filters,
  limit,
  skip,
  sortField,
  sortDirection,
}: {
  filters: FilterRow[];
  limit: number | undefined;
  skip: number | undefined;
  sortField: string | undefined;
  sortDirection: string | undefined;
}): Record<string, string> {
  const params: Record<string, string> = {};

  for (const filter of filters) {
    const field = filter.field?.trim();
    if (!field) {
      continue;
    }
    const key =
      filter.operator && filter.operator !== 'equals'
        ? `${field}__${filter.operator}`
        : field;
    params[key] = String(filter.value ?? '');
  }

  if (limit !== undefined && limit !== null) {
    params['limit'] = String(limit);
  }
  if (skip !== undefined && skip !== null) {
    params['skip'] = String(skip);
  }
  if (sortField) {
    params['sort'] = sortDirection === 'asc' ? sortField : `-${sortField}`;
  }

  return params;
}

export const findSubmissions = createAction({
  auth: formioAuth,
  name: 'find_submissions',
  displayName: 'Find Submissions',
  description: 'Search a form for submissions matching field filters',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the submissions of a Form.io form, filtering on submitted field values or on the created and modified timestamps, with paging and sorting. Field paths are prefixed with data, for example data.email. Choose it to look records up by their content; use Get Submission when the id is already known. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: findSubmissionsOutputSchema,
  props: {
    formPath: formioProps.formPath,
    filters: Property.Array({
      displayName: 'Filters',
      description:
        'Each row narrows the search. Use a data-prefixed path for a form field, for example data.email, or created / modified for the timestamps.',
      required: false,
      properties: {
        field: Property.ShortText({
          displayName: 'Field',
          description: 'For example data.category',
          required: true,
        }),
        operator: Property.StaticDropdown({
          displayName: 'Operator',
          required: true,
          defaultValue: 'equals',
          options: {
            options: [
              { label: 'Equals', value: 'equals' },
              { label: 'Not equal', value: 'ne' },
              { label: 'Greater than', value: 'gt' },
              { label: 'Greater than or equal', value: 'gte' },
              { label: 'Less than', value: 'lt' },
              { label: 'Less than or equal', value: 'lte' },
              { label: 'In (comma separated)', value: 'in' },
              { label: 'Matches regular expression', value: 'regex' },
              { label: 'Exists (true or false)', value: 'exists' },
            ],
          },
        }),
        value: Property.ShortText({
          displayName: 'Value',
          required: true,
        }),
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many submissions to return. Form.io defaults to 10.',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'How many submissions to skip, for paging',
      required: false,
    }),
    sortField: Property.ShortText({
      displayName: 'Sort By',
      description: 'For example created, modified, or data.refNumber',
      required: false,
      defaultValue: 'created',
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Newest first', value: 'desc' },
          { label: 'Oldest first', value: 'asc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const filters = (propsValue.filters ?? []) as FilterRow[];

    const { submissions, total } = await formioCommon.findSubmissions({
      auth: auth.props,
      formPath: propsValue.formPath,
      queryParams: buildQueryParams({
        filters,
        limit: propsValue.limit,
        skip: propsValue.skip,
        sortField: propsValue.sortField,
        sortDirection: propsValue.sortDirection,
      }),
    });

    return {
      submissions,
      count: submissions.length,
      total: total ?? submissions.length,
    };
  },
});

export type FilterRow = {
  field: string;
  operator: string;
  value: unknown;
};
