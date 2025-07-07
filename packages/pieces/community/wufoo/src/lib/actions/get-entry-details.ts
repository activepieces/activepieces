import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier } from '../common/props';

export const getEntryDetailsAction = createAction({
  auth: wufooAuth,
  name: 'get-entry-details',
  displayName: 'Get Entry Details',
  description: 'Retrieve one or more form entries by Entry ID or filters.',
  props: {
    formIdentifier: formIdentifier,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    entryId: Property.Number({
      displayName: 'Entry ID (optional)',
      description:
        'Optional. If provided, filters to only that entry. Leave blank to get all entries.',
      required: false,
    }),
    sort: Property.ShortText({
      displayName: 'Sort By (Field ID)',
      description: 'e.g., EntryId, Field1, Field105. Leave blank for no sorting.',
      required: false,
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Descending', value: 'DESC' },
          { label: 'Ascending', value: 'ASC' },
        ],
      },
    }),
    pageStart: Property.Number({
      displayName: 'Page Start',
      required: false,
      defaultValue: 0,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum 100 entries per request.',
      required: false,
      defaultValue: 25,
    }),
    includeSystem: Property.Checkbox({
      displayName: 'Include System Fields',
      required: false,
      defaultValue: false,
    }),
    pretty: Property.Checkbox({
      displayName: 'Pretty Print',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      formIdentifier,
      format,
      entryId,
      sort,
      sortDirection,
      pageStart,
      pageSize,
      includeSystem,
      pretty,
    } = context.propsValue;

    const query: Record<string, string> = {
      pageStart: String(pageStart ?? 0),
      pageSize: String(pageSize ?? 25),
      system: includeSystem ? 'true' : 'false',
      pretty: pretty ? 'true' : 'false',
    };

    if (entryId !== undefined) {
      query['Filter1'] = `EntryId+Is_equal_to+${entryId}`;
    }

    if (sort) {
      query['sort'] = sort;
      if (sortDirection) query['sortDirection'] = sortDirection;
    }

    const response = await wufooApiCall({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: `/forms/${formIdentifier}/entries.${format}`,
      query,
    });

    return response;
  },
});
