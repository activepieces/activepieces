import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, nocodbCommon } from '../common';
import { ListAPIResponse, ListAPIV3Response } from '../common/types';
import { nocodbSearchRecordsOutputSchema } from '../output-schemas';

export const searchRecordsAction = createAction({
  auth: nocodbAuth,
  name: 'nocodb-search-records',
  classification: 'SEARCH',
  outputSchema: nocodbSearchRecordsOutputSchema,
  displayName: 'Search Records',
  description: 'Finds records in a table, with an optional filter and sort.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists rows from a NocoDB table within the chosen base, optionally narrowed by a Where filter expression and ordered by a Sort field list; leaving the Where condition empty returns all records up to the Limit. Use when an agent needs to find or browse records by criteria rather than by a known Record ID. Idempotent read-only query.',
    idempotent: true,
  },
  props: {
    workspaceId: nocodbCommon.workspaceId,
    baseId: nocodbCommon.baseId,
    tableId: nocodbCommon.tableId,
    columnId: nocodbCommon.columnId,
    whereCondition: Property.LongText({
      displayName: 'Where',
      required: false,
      description: 'Filter in NocoDB syntax. Leave empty to return all records.',
      placeholder: '(Status,eq,Active)~and(Price,gt,100)',
    }),
    limit: Property.Number({
      displayName: 'Maximum Records',
      required: true,
      defaultValue: 10,
      description: 'NocoDB returns at most 1000 records per search.',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
    }),
    sort: Property.LongText({
      displayName: 'Sort',
      required: false,
      description:
        'Comma-separated field names. Put - before a name to sort descending.',
      placeholder: 'Name,-CreatedAt',
    }),
  },
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Table',
      icon: 'location',
      props: ['workspaceId', 'baseId', 'tableId'],
    },
    {
      key: 'filter',
      display: 'section',
      label: 'Filter',
      icon: 'filter',
      props: ['whereCondition', 'sort'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['columnId', 'limit'],
    },
  ],
  async run(context) {
    const { baseId, tableId, columnId, limit, whereCondition, sort } =
      context.propsValue;

    const client = makeClient(context.auth);
    const authVersion = context.auth.props.version || 3;
    const response = await client.listRecords(
      baseId,
      tableId,
      {
        fields: columnId ? columnId.join(',') : undefined,
        where: whereCondition,
        sort,
        offset: 0,
        limit,
      },
      authVersion
    );
    return authVersion === 4
      ? (response as ListAPIV3Response<Record<string, unknown>>).records
      : (response as ListAPIResponse<Record<string, unknown>>).list;
  },
});
