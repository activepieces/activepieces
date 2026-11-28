import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { MAX_PAGE_SIZE } from '../common/constants';
import { odata } from '../common/odata';
import { searchRecordsOutputSchema } from '../common/output-schemas';
import { dynamicsProps } from '../common/props';

export const searchRecordsAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'search_records',
  classification: 'SEARCH',
  displayName: 'Search Records',
  description: 'Lists records of any table with an optional OData filter, columns and sort order.',
  audience: 'human',
  aiMetadata: {
    description: 'Lists Dynamics 365 records with an OData filter. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType('The table to search.'),
    filter: Property.ShortText({
      displayName: 'Filter',
      description:
        "Optional OData filter, for example: statecode eq 0 and contains(name,'Contoso'). Lookup columns use _<name>_value.",
      required: false,
      placeholder: 'statecode eq 0',
    }),
    columns: dynamicsProps.columnsDropdown({ entitySetProp: 'entityType' }),
    orderBy: Property.ShortText({
      displayName: 'Sort By',
      description: 'Optional, for example: createdon desc.',
      required: false,
      placeholder: 'createdon desc',
    }),
    limit: Property.Number({
      displayName: 'Page Size',
      description: `How many records to return (1 to ${MAX_PAGE_SIZE}). Use Next Page Link to get the next page.`,
      required: false,
      defaultValue: 50,
      display: 'stepper',
      min: 1,
      max: MAX_PAGE_SIZE,
      step: 1,
    }),
    nextLink: Property.ShortText({
      displayName: 'Next Page Link',
      description: 'Optional. Map Next Page Link from a previous Search Records step to get the next page. The other search fields are then ignored.',
      required: false,
      advanced: true,
    }),
    includeFormattedValues: Property.Checkbox({
      displayName: 'Include Readable Values',
      description: 'Also return display text as <column>_formatted fields.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  outputSchema: searchRecordsOutputSchema,
  async run(context) {
    const { entityType, filter, columns, orderBy, limit, nextLink, includeFormattedValues } = context.propsValue;
    return await makeClient(context.auth).listRecords({
      entitySet: entityType,
      filter: dynamicsProps.readString(filter),
      select: odata.parseColumnList(columns),
      orderby: dynamicsProps.readString(orderBy),
      pageSize: odata.readPageSize({ value: limit, max: MAX_PAGE_SIZE }),
      nextLink: dynamicsProps.readString(nextLink),
      formatted: includeFormattedValues === true,
    });
  },
});
