import {
  createAction,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyPropUtils, ninetyProps } from '../common/props';
import { rockListOutputSchema } from '../common/output-schemas';

export const findRocks = createAction({
  auth: ninetyAuth,
  name: 'find_rocks',
  classification: 'SEARCH',
  displayName: 'Find Rocks',
  description: 'Search Ninety rocks by team, owner, status or quarter horizon',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Ninety rocks and returns the matching page. Ninety cannot sort rocks by creation date, so this orders by due date by default. Non-archived rocks only unless you ask otherwise. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: rockListOutputSchema,
  props: {
    teamId: ninetyProps.teamIdOptional,
    userId: ninetyProps.ownerIdFilter,
    statusCode: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'On track', value: 'ON_TRACK' },
          { label: 'Off track', value: 'OFF_TRACK' },
          { label: 'Done', value: 'DONE' },
          { label: 'Canceled', value: 'CANCELED' },
          { label: 'Draft', value: 'DRAFT' },
        ],
      },
    }),
    levelCode: Property.StaticDropdown({
      displayName: 'Level',
      required: false,
      options: {
        options: [
          { label: 'Individual', value: 'USER' },
          { label: 'Department', value: 'DEPARTMENT' },
          { label: 'Company', value: 'COMPANY' },
          { label: 'Company and department', value: 'COMPANY_AND_DEPARTMENT' },
        ],
      },
    }),
    futureScope: Property.StaticDropdown({
      displayName: 'Planning Horizon',
      required: false,
      options: {
        options: [
          { label: 'Current', value: 'Current' },
          { label: 'Next', value: 'Next' },
          { label: 'Later', value: 'Later' },
          { label: 'Future', value: 'Future' },
          { label: 'All horizons', value: 'all' },
        ],
      },
    }),
    archived: ninetyProps.archivedFilter,
    searchText: ninetyProps.searchText,
    sortField: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Ninety does not offer a created-date sort for rocks',
      required: false,
      defaultValue: 'dueDate',
      options: {
        options: [
          { label: 'Due date', value: 'dueDate' },
          { label: 'Due quarter', value: 'dueDateQuarter' },
          { label: 'Completed date', value: 'completedDate' },
          { label: 'Title', value: 'title' },
          { label: 'Status', value: 'statusCode' },
          { label: 'Owner', value: 'owner' },
          { label: 'Team', value: 'team' },
        ],
      },
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Newest or highest first', value: 'DESC' },
          { label: 'Oldest or lowest first', value: 'ASC' },
        ],
      },
    }),
    pageIndex: ninetyProps.pageIndex,
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many rocks to return. Ninety allows up to 200.',
      required: false,
      min: 0,
      max: 200,
    }),
  },
  async run({ auth, propsValue }) {
    const { items, totalCount } = await ninetyCommon.queryRocks({
      token: auth.secret_text,
      query: {
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('userId', propsValue.userId),
        ...spreadIfDefined('statusCode', propsValue.statusCode),
        ...spreadIfDefined('levelCode', propsValue.levelCode),
        ...spreadIfDefined('futureScope', propsValue.futureScope),
        ...spreadIfDefined('searchText', propsValue.searchText),
        ...spreadIfDefined('sortField', propsValue.sortField),
        ...spreadIfDefined('sortDirection', propsValue.sortDirection),
        ...spreadIfDefined('pageIndex', propsValue.pageIndex),
        ...spreadIfDefined('pageSize', propsValue.pageSize),
        ...spreadIfDefined(
          'archived',
          ninetyPropUtils.triStateToBoolean(propsValue.archived)
        ),
      },
    });

    return { rocks: items, count: items.length, totalCount };
  },
});
