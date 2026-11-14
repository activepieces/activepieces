import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { odata } from '../common/odata';
import { fetchXmlOutputSchema } from '../common/output-schemas';
import { dynamicsProps } from '../common/props';

export const runFetchXmlAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'run_fetchxml',
  classification: 'SEARCH',
  displayName: 'Run FetchXML Query',
  description: 'Runs a FetchXML query (joins, aggregates, advanced filters) and returns the matching rows.',
  audience: 'human',
  aiMetadata: {
    description: 'Runs a read-only FetchXML query against a Dynamics 365 table. Safe to retry.',
    idempotent: true,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType('The table named in the <entity> element of the query.'),
    fetchXml: Property.LongText({
      displayName: 'FetchXML',
      description:
        'The query, for example `<fetch top="50"><entity name="account"><attribute name="name"/></entity></fetch>`. Build one in Advanced Find and use Download FetchXML.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Optional page number. Use with a `count` attribute on <fetch> and the Paging Cookie from the previous page.',
      required: false,
    }),
    pagingCookie: Property.LongText({
      displayName: 'Paging Cookie',
      description: 'Optional. Map the Paging Cookie from the previous page.',
      required: false,
    }),
  },
  outputSchema: fetchXmlOutputSchema,
  async run(context) {
    const { entityType, fetchXml, page, pagingCookie } = context.propsValue;
    return await runFetchXml({
      auth: context.auth,
      entitySet: entityType,
      fetchXml,
      page,
      pagingCookie: dynamicsProps.readString(pagingCookie),
    });
  },
});

async function runFetchXml({ auth, entitySet, fetchXml, page, pagingCookie }: RunFetchXmlParams) {
  const pageNumber = page === undefined || page === null ? undefined : Number(page);
  const query = odata.applyFetchPaging({ fetchXml, page: pageNumber, pagingCookie });
  const result = await makeClient(auth).runFetchXml({ entitySet, fetchXml: query });
  return {
    records: result.records,
    moreRecords: result.moreRecords,
    nextPage: result.moreRecords ? (pageNumber ?? 1) + 1 : null,
    pagingCookie: result.pagingCookie,
  };
}

type RunFetchXmlParams = {
  auth: Parameters<typeof makeClient>[0];
  entitySet: string;
  fetchXml: string;
  page: unknown;
  pagingCookie?: string;
};

export const fetchXmlRunner = { runFetchXml };
