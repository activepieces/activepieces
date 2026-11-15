import {
  createAction,
  isNil,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyProps } from '../common/props';
import { measurableListOutputSchema } from '../common/output-schemas';

export const findMeasurables = createAction({
  auth: ninetyAuth,
  name: 'find_measurables',
  classification: 'SEARCH',
  displayName: 'Find Measurables',
  description: 'Search the Ninety scorecard for measurables',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Ninety scorecard measurables, the tracked weekly or monthly numbers of the EOS model. Use it to find the measurable id that Set Measurable Score needs. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: measurableListOutputSchema,
  props: {
    teamId: ninetyProps.teamIdOptional,
    userIds: ninetyProps.ownerIds,
    periodInterval: Property.StaticDropdown({
      displayName: 'Cadence',
      description: 'How often the measurable is scored',
      required: false,
      options: {
        options: [
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Quarterly', value: 'quarterly' },
          { label: 'Annual', value: 'annual' },
        ],
      },
    }),
    searchTitle: Property.ShortText({
      displayName: 'Title Contains',
      required: false,
    }),
    searchOwner: Property.ShortText({
      displayName: 'Owner Name Contains',
      required: false,
    }),
    searchText: ninetyProps.searchText,
    unassignedOnly: Property.Checkbox({
      displayName: 'Unowned Only',
      description: 'Only return measurables with nobody accountable for them',
      required: false,
    }),
    sortField: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: [
          { label: 'Title', value: 'title' },
          { label: 'Owner', value: 'owner' },
          { label: 'ID', value: 'id' },
        ],
      },
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'ASC' },
          { label: 'Descending', value: 'DESC' },
        ],
      },
    }),
    pageIndex: ninetyProps.pageIndex,
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many measurables to return. Ninety defaults to 25.',
      required: false,
      min: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const { items, totalCount } = await ninetyCommon.queryMeasurables({
      token: auth.secret_text,
      query: {
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('periodInterval', propsValue.periodInterval),
        ...spreadIfDefined('searchTitle', propsValue.searchTitle),
        ...spreadIfDefined('searchOwner', propsValue.searchOwner),
        ...spreadIfDefined('searchText', propsValue.searchText),
        ...spreadIfDefined('unassignedOnly', propsValue.unassignedOnly),
        ...spreadIfDefined('sortField', propsValue.sortField),
        ...spreadIfDefined('sortDirection', propsValue.sortDirection),
        ...spreadIfDefined('pageIndex', propsValue.pageIndex),
        ...spreadIfDefined('pageSize', propsValue.pageSize),
        ...spreadIfDefined(
          'userIds',
          isNil(propsValue.userIds) || propsValue.userIds.length === 0
            ? undefined
            : propsValue.userIds
        ),
      },
    });

    return { measurables: items, count: items.length, totalCount };
  },
});
