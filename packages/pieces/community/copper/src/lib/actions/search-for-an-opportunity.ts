import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, toUnix } from '../common/constants';
import {
  multiCompanyDropdown,
  MultiCustomerSourceDropdown,
  MultiLossReasonsDropdown,
  multiPipelinesDropdown,
  multiPrimaryContactsDropdown,
  multiUsersDropdown,
  pipelinesDropdown,
} from '../common/props';
import { CopperApiService } from '../common/requests';

export const searchForAnOpportunity = createAction({
  auth: CopperAuth,
  name: 'searchForAnOpportunity',
  displayName: 'Search for an Opportunity',
  description: 'Lookup an opportunity.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the Opportunity to search for.',
      required: false,
    }),
    assignee_ids: multiUsersDropdown({ refreshers: ['auth'] }),
    company_ids: multiCompanyDropdown({ refreshers: ['auth'] }),
    status_ids: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Filter by Opportunity status',
      required: false,
      options: {
        options: [
          {
            label: 'Open',
            value: '0',
          },
          {
            label: 'Won',
            value: '1',
          },
          {
            label: 'Lost',
            value: '2',
          },
          {
            label: 'Abandoned',
            value: '3',
          },
        ],
      },
    }),
    priorities: Property.StaticMultiSelectDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'None' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      },
    }),
    pipeline_ids: multiPipelinesDropdown({ refreshers: ['auth'] }),
    pipeline_stage_ids: Property.MultiSelectDropdown({
      displayName: 'Pipeline Stage',
      description: 'Select a stage',
      refreshers: ['auth', 'pipeline_ids'],
      required: false,
      async options({ auth, pipeline_ids }: any) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Copper account first',
            options: [],
          };
        }

        if (!pipeline_ids) {
          return {
            disabled: true,
            placeholder: 'Select a pipeline first',
            options: [],
          };
        }

        const stages = pipeline_ids.flatMap((pipeline: any) => {
          const stages = JSON.parse(pipeline).stages ?? [];
          return stages;
        });

        return {
          options: stages.map((stage: any) => ({
            label: stage.name,
            value: stage.id,
          })),
        };
      },
    }),
    primary_contact_ids: multiPrimaryContactsDropdown({ refreshers: ['auth'] }),
    customer_source_ids: MultiCustomerSourceDropdown({}),
    loss_reason_ids: MultiLossReasonsDropdown({}),
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
            label: 'Assignee',
            value: 'assignee',
          },
          {
            label: 'Company Name',
            value: 'company_name',
          },
          {
            label: 'Customer Source ID',
            value: 'customer_source_id',
          },
          {
            label: 'Date Created',
            value: 'date_created',
          },
          {
            label: 'Date Modified',
            value: 'date_modified',
          },
          {
            label: 'Inactive Days',
            value: 'inactive_days',
          },
          {
            label: 'Interaction Count',
            value: 'interaction_count',
          },
          {
            label: 'Last Interaction',
            value: 'last_interaction',
          },
          {
            label: 'Monetary Unit',
            value: 'monetary_unit',
          },
          {
            label: 'Monetary Value',
            value: 'monetary_value',
          },
          {
            label: 'Name',
            value: 'name',
          },
          {
            label: 'Primary Contact',
            value: 'primary_contact',
          },
          {
            label: 'Priority',
            value: 'priority',
          },
          {
            label: 'Stage',
            value: 'stage',
          },
          {
            label: 'Status',
            value: 'status',
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
    minimum_monetary_value: Property.Number({
      displayName: 'Minimum Monetary Value',
      required: false,
      description: 'The minimum monetary value Opportunities must have.',
    }),
    maximum_monetary_value: Property.Number({
      displayName: 'Maximum Monetary Value',
      required: false,
      description: 'The maximum monetary value Opportunities must have.',
    }),
    minimum_interaction_count: Property.Number({
      displayName: 'Minimum Interaction Count',
      required: false,
      description:
        'The minimum number of interactions Opportunity must have had.',
    }),
    maximum_interaction_count: Property.Number({
      displayName: 'Maximum Interaction Count',
      required: false,
      description:
        'The maximum number of interactions Opportunity must have had.',
    }),
    minimum_close_date: Property.DateTime({
      displayName: 'Minimum Interaction Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date close date.',
    }),
    maximum_close_date: Property.DateTime({
      displayName: 'Maximum Interaction Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date close date.',
    }),
    minimum_interaction_date: Property.DateTime({
      displayName: 'Minimum Interaction Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date of the last interaction.',
    }),
    maximum_interaction_date: Property.DateTime({
      displayName: 'Maximum Interaction Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date of the last interaction.',
    }),
    minimum_stage_change_date: Property.DateTime({
      displayName: 'Minimum Stage Change Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date of a stage change.',
    }),
    maximum_stage_change_date: Property.DateTime({
      displayName: 'Maximum Stage Change Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date of a stage change.',
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
      status_ids,
      customer_source_ids,
      pipeline_ids,
      pipeline_stage_ids,
      company_ids,
      tags,
      followed,
      page_size,
      page_number,
      sort_by,
      sort_direction,
      priorities,
      minimum_interaction_count,
      maximum_interaction_count,
      minimum_interaction_date,
      maximum_interaction_date,
      minimum_created_date,
      maximum_created_date,
      minimum_monetary_value,
      maximum_monetary_value,
      minimum_modified_date,
      maximum_modified_date,
      minimum_close_date,
      minimum_stage_change_date,
      maximum_close_date,
      maximum_stage_change_date,
      primary_contact_ids,
      loss_reason_ids,
    } = context.propsValue;

    const payload = {
      name,
      assignee_ids,
      status_ids,
      customer_source_ids,
      pipeline_ids: (pipeline_ids ?? []).flatMap((pipeline: any) => {
        const id = JSON.parse(pipeline).id ?? [];
        return id;
      }),
      pipeline_stage_ids,
      company_ids,
      primary_contact_ids,
      loss_reason_ids,
      tags,
      priorities,
      followed,
      page_size,
      page_number,
      sort_by,
      sort_direction,
      minimum_interaction_count,
      maximum_interaction_count,
      minimum_interaction_date: toUnix(minimum_interaction_date),
      maximum_interaction_date: toUnix(maximum_interaction_date),
      minimum_created_date: toUnix(minimum_created_date),
      maximum_created_date: toUnix(maximum_created_date),
      minimum_monetary_value,
      maximum_monetary_value,
      minimum_modified_date: toUnix(minimum_modified_date),
      maximum_modified_date: toUnix(maximum_modified_date),
      minimum_close_date: toUnix(minimum_close_date),
      minimum_stage_change_date: toUnix(minimum_stage_change_date),
      maximum_close_date: toUnix(maximum_close_date),
      maximum_stage_change_date: toUnix(maximum_stage_change_date),
    };

    return await CopperApiService.fetchOpportunities(context.auth, payload);
  },
});
