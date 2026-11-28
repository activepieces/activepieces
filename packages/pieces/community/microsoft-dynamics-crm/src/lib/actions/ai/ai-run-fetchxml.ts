import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { fetchXmlRunner } from '../run-fetchxml';
import { fetchXmlOutputSchema } from '../../common/output-schemas';

export const aiRunFetchXmlAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_run_fetchxml',
  classification: 'SEARCH',
  displayName: 'Run FetchXML',
  description: 'Runs a FetchXML query against a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs a FetchXML query (joins via link-entity, aggregates, complex filters) on one Dynamics 365 table. For paging set count on <fetch>, then pass page and pagingCookie from the previous result. Read-only.',
    idempotent: true,
  },
  props: {
    entitySet: Property.ShortText({
      displayName: 'Entity Set',
      description: 'Entity set name (plural), for example contacts, accounts, leads or opportunities. Get it from List Entities.',
      required: true,
    }),
    fetchXml: Property.LongText({
      displayName: 'FetchXML',
      description: 'The <fetch> query; the <entity name> must match the entity set table.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Optional page number (use nextPage from the previous result).',
      required: false,
    }),
    pagingCookie: Property.ShortText({
      displayName: 'Paging Cookie',
      description: 'Optional pagingCookie from the previous result.',
      required: false,
    }),
  },
  outputSchema: fetchXmlOutputSchema,
  async run(context) {
    const { entitySet, fetchXml, page, pagingCookie } = context.propsValue;
    return await fetchXmlRunner.runFetchXml({
      auth: context.auth,
      entitySet,
      fetchXml,
      page,
      pagingCookie: pagingCookie?.trim() || undefined,
    });
  },
});
