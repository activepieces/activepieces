import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp, recordList, requiredText } from '../../ai-common';
import { pagedRecordListSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertModuleName, assertRecordId, clampLimit, VTQL_PAGE_SIZE } from '../../vtql';

export function relatedQueryParams({
  recordId,
  relatedModule,
  relatedLabel,
  limit,
  offset,
}: {
  recordId: unknown;
  relatedModule: unknown;
  relatedLabel: unknown;
  limit: unknown;
  offset: unknown;
}): { query: Record<string, string>; limit: number; offset: number } {
  const module = assertModuleName(relatedModule);
  const size = clampLimit({ value: limit, fallback: VTQL_PAGE_SIZE, max: VTQL_PAGE_SIZE });
  const start = offset === undefined || offset === null || offset === '' ? 0 : Number(offset);
  if (!Number.isInteger(start) || start < 0) {
    throw new Error('Offset must be a whole number of 0 or more');
  }
  const label = requiredText({ value: relatedLabel, label: 'Relation Label' });
  return {
    query: {
      query: `SELECT * FROM ${module} LIMIT ${start}, ${size}`,
      id: assertRecordId({ value: recordId }),
      relatedLabel: label,
    },
    limit: size,
    offset: start,
  };
}

export const queryRelatedRecordsAction = createAction({
  auth: vtigerAuth,
  name: 'query_related_records',
  displayName: 'Query Related Records',
  description: 'Pages through the related records of one module linked to a Vtiger record.',
  classification: 'SEARCH',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page (up to 100) of the records of a related module linked to a record, e.g. Potentials of an Account. When hasMore is true, call again with offset + limit. Take the relation label and related module from List Relation Types; they differ for some relations (Calendar is labelled Activities).',
    idempotent: true,
  },
  outputSchema: pagedRecordListSchema,
  props: {
    recordId: recordIdProp({ description: 'Webservice ID of the parent record, for example 11x42.' }),
    relatedModule: Property.ShortText({
      displayName: 'Related Module',
      description: 'API name of the related module, for example Contacts.',
      required: true,
    }),
    relatedLabel: Property.ShortText({
      displayName: 'Relation Label',
      description: 'The relation label from List Relation Types (its label, not the translated label), for example Contacts or Activities.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Records per page, 1 to 100 (default 100).',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of records to skip (default 0).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const params = relatedQueryParams(propsValue);
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'query_related',
      query: params.query,
    });
    const records = recordList(result);
    return {
      records,
      count: records.length,
      offset: params.offset,
      hasMore: records.length >= params.limit,
    };
  },
});
