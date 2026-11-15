import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { AI_MAX_PAGE_SIZE } from '../../common/constants';
import { searchRecordsOutputSchema } from '../../common/output-schemas';

export const aiSearchRecordsAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_search_records',
  classification: 'SEARCH',
  displayName: 'Search Records',
  description: 'Searches records of a table with an OData filter.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Finds Dynamics 365 records with an OData $filter (e.g. emailaddress1 eq 'a@b.com', contains(name,'x'); lookups as _parentcustomerid_value). Returns up to pageSize records and a nextLink cursor for more. Use Run FetchXML for joins or aggregates. Read-only.",
    idempotent: true,
  },
  props: {
    entitySet: Property.ShortText({
      displayName: 'Entity Set',
      description: 'Entity set name (plural), for example contacts, accounts, leads or opportunities. Get it from List Entities.',
      required: true,
    }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description: 'Optional OData $filter expression.',
      required: false,
    }),
    select: Property.ShortText({
      displayName: 'Columns',
      description: 'Optional comma-separated column logical names to return. Leave empty for all.',
      required: false,
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By',
      description: 'Optional, for example createdon desc.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Records per page, 1 to 100. Default 25.',
      required: false,
    }),
    nextLink: Property.ShortText({
      displayName: 'Next Link',
      description: 'Optional cursor from a previous call; when set the other search inputs are ignored.',
      required: false,
    }),
  },
  outputSchema: searchRecordsOutputSchema,
  async run(context) {
    const { entitySet, filter, select, orderBy, pageSize, nextLink } = context.propsValue;
    return await makeClient(context.auth).listRecords({
      entitySet,
      filter: filter?.trim() || undefined,
      select: odata.parseColumnList(select),
      orderby: orderBy?.trim() || undefined,
      pageSize: pageSize === undefined || pageSize === null ? 25 : odata.readPageSize({ value: pageSize, max: AI_MAX_PAGE_SIZE }),
      nextLink: nextLink?.trim() || undefined,
      formatted: true,
    });
  },
});
