import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { pipelineDropdown, pipelineStageDropdown } from '../common/dropdowns';
import { outsetaListProps } from '../common/list-props';
import { outsetaMappers } from '../common/mappers';
import { outsetaQuery } from '../common/list-query';
import { OutsetaDeal } from '../common/outseta-types';

export const listDealsAction = createAction({
  name: 'list_deals',
  auth: outsetaAuth,
  displayName: 'List Deals',
  description:
    'List CRM deals, optionally filtered and sorted. Each deal comes back in the same shape as Retrieve Deal.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Outseta CRM deals with optional filters (free-text search, pipeline, pipeline stage, name, amount range, due date range, created or updated date range) and sorting. Items have the same shape as Retrieve Deal. Use for browsing or filtering many deals; to fetch one known deal use Retrieve Deal. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'deal',
      display: 'builder',
      label: 'Deal',
      icon: 'tag',
      props: ['search', 'name', 'minAmount', 'maxAmount'],
    },
    {
      key: 'pipeline',
      display: 'builder',
      label: 'Pipeline',
      icon: 'filter',
      props: ['pipelineUid', 'pipelineStageUid'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Dates',
      icon: 'calendar',
      props: ['dueDateRange', 'createdRange', 'updatedRange'],
    },
    {
      key: 'sort',
      display: 'builder',
      label: 'Sort',
      icon: 'sliders',
      props: ['sortBy', 'direction'],
    },
    { key: 'paging', display: 'footer', props: ['limit', 'page'] },
  ],
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      icon: 'text',
      placeholder: 'renewal',
    }),
    name: Property.ShortText({
      displayName: 'Name contains',
      required: false,
      icon: 'text',
      placeholder: 'renewal',
    }),
    minAmount: Property.Number({
      displayName: 'Amount at least',
      required: false,
      icon: 'sliders',
    }),
    maxAmount: Property.Number({
      displayName: 'Amount at most',
      required: false,
      icon: 'sliders',
    }),
    pipelineUid: pipelineDropdown({
      required: false,
      description: 'Only return deals in this pipeline.',
    }),
    pipelineStageUid: pipelineStageDropdown({
      required: false,
      description: 'Only return deals at this stage. Pick a pipeline first.',
    }),
    dueDateRange: Property.DateRange({
      displayName: 'Due date',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    createdRange: Property.DateRange({
      displayName: 'Created',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    updatedRange: Property.DateRange({
      displayName: 'Updated',
      required: false,
      display: 'dropdown',
      icon: 'calendar',
    }),
    sortBy: outsetaListProps.sortBy({
      options: [
        { label: 'Created', value: 'Created' },
        { label: 'Updated', value: 'Updated' },
        { label: 'Name', value: 'Name' },
        { label: 'Amount', value: 'Amount' },
        { label: 'Due date', value: 'DueDate' },
      ],
      defaultValue: 'Created',
    }),
    direction: outsetaListProps.direction(),
    limit: outsetaListProps.limit(),
    page: outsetaListProps.page(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const query = outsetaQuery.build({
      filters: [
        { field: 'q', value: context.propsValue.search },
        { field: 'Name', operator: 'contains', value: context.propsValue.name },
        { field: 'Amount', operator: 'gte', value: context.propsValue.minAmount },
        { field: 'Amount', operator: 'lte', value: context.propsValue.maxAmount },
        {
          field: 'DealPipelineStage.DealPipeline.Uid',
          value: context.propsValue.pipelineUid,
        },
        { field: 'DealPipelineStage.Uid', value: context.propsValue.pipelineStageUid },
        ...outsetaQuery.dateRangeFilters({
          field: 'DueDate',
          range: context.propsValue.dueDateRange,
        }),
        ...outsetaQuery.dateRangeFilters({
          field: 'Created',
          range: context.propsValue.createdRange,
        }),
        ...outsetaQuery.dateRangeFilters({
          field: 'Updated',
          range: context.propsValue.updatedRange,
        }),
      ],
      orderBy: context.propsValue.sortBy,
      orderDirection: context.propsValue.direction,
      limit: context.propsValue.limit,
      page: context.propsValue.page,
    });

    const result = await client.getPage<OutsetaDeal>(
      `/api/v1/crm/deals?${query}&${DEAL_FIELDS}`
    );

    return {
      items: result.items.map(outsetaMappers.deal),
      ...outsetaQuery.pageInfo(result),
    };
  },
});

const DEAL_FIELDS =
  'fields=*,DealPipelineStage.Uid,DealPipelineStage.Name,DealPipelineStage.DealPipeline.Uid,DealPipelineStage.DealPipeline.Name,DealPeople.Person.Uid,DealPeople.Person.Email,Account.Uid,Account.Name';
