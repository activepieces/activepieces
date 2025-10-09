import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, toUnix } from '../common/constants';
import { CopperApiService } from '../common/requests';
import { multiUsersDropdown } from '../common/props';

export const searchForAProject = createAction({
  auth: CopperAuth,
  name: 'searchForAProject',
  displayName: 'Search for a Project',
  description: 'Lookup a project.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the Opportunity to search for.',
      required: false,
    }),
    assignee_ids: multiUsersDropdown({ refreshers: ['auth'] }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Filter by Opportunity status',
      required: false,
      options: {
        options: [
          {
            label: 'Open',
            value: 'Open',
          },
          {
            label: 'Completed',
            value: 'Completed',
          },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Filter People to those that match at least one of the tags specified.',
      required: false,
      defaultValue: [],
    }),
    followed: Property.StaticDropdown({
      displayName: 'Followed',
      description: 'Filter by followed state',
      required: false,
      options: {
        options: [
          {
            label: 'followed',
            value: '1',
          },
          {
            label: 'not followed',
            value: '2',
          },
        ],
      },
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Default 50. Max 200.',
      required: false,
      defaultValue: 50,
    }),
    page_number: Property.Number({
      displayName: 'Page Number',
      required: false,
      defaultValue: 1,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'The field on which to sort the results',
      required: false,
      options: {
        options: [
          {
            label: 'Name',
            value: 'name',
          },
          {
            label: 'Assigned To',
            value: 'assigned_to',
          },
          {
            label: 'Related To',
            value: 'related_to',
          },
          {
            label: 'Status',
            value: 'status',
          },
          {
            label: 'Date Modified',
            value: 'date_modified',
          },
          {
            label: 'Date Created',
            value: 'date_created',
          },
        ],
      },
    }),
    sort_direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'The direction in which to sort the result',
      required: false,
      options: {
        options: [
          {
            label: 'Ascending',
            value: 'asc',
          },
          {
            label: 'Descending',
            value: 'desc',
          },
        ],
      },
    }),
    minimum_created_date: Property.DateTime({
      displayName: 'Minimum Created Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date Opportunity are created.',
    }),
    maximum_created_date: Property.DateTime({
      displayName: 'Maximum Created Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date Opportunity are Created.',
    }),
    minimum_modified_date: Property.DateTime({
      displayName: 'Minimum Modified Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date Opportunity are Modified.',
    }),
    maximum_modified_date: Property.DateTime({
      displayName: 'Maximum Modified Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date Opportunity are Modified.',
    }),
  },
  async run(context) {
    const {
      name,
      assignee_ids,
      statuses,
      tags,
      followed,
      page_size,
      page_number,
      sort_by,
      sort_direction,
      minimum_created_date,
      maximum_created_date,
      minimum_modified_date,
      maximum_modified_date,
    } = context.propsValue;

    const payload = {
      name,
      assignee_ids: assignee_ids || [],
      statuses,
      followed,
      page_size,
      page_number,
      sort_by,
      tags,
      sort_direction,
      minimum_created_date: toUnix(minimum_created_date),
      maximum_created_date: toUnix(maximum_created_date),
      minimum_modified_date: toUnix(minimum_modified_date),
      maximum_modified_date: toUnix(maximum_modified_date),
    };

    return await CopperApiService.fetchProjects(context.auth, payload);
  },
});
