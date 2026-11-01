import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp, recordList, requiredText } from '../../ai-common';
import { recordListSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertModuleName, assertRecordId } from '../../vtql';

export const listRelatedRecordsAction = createAction({
  auth: vtigerAuth,
  name: 'list_related_records',
  displayName: 'List Related Records',
  description: 'Lists the records in one related list of a Vtiger record.',
  classification: 'SEARCH',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the records in one related list of a record, e.g. the Contacts of an Account. Take the relation label and related module from List Relation Types for the record's module. Use Query Related Records when you need paging.",
    idempotent: true,
  },
  outputSchema: recordListSchema,
  props: {
    recordId: recordIdProp({ description: 'Webservice ID of the parent record, for example 11x42.' }),
    relatedLabel: Property.ShortText({
      displayName: 'Relation Label',
      description: 'The relation label from List Relation Types (its label, not the translated label), for example Contacts or Activities.',
      required: true,
    }),
    relatedModule: Property.ShortText({
      displayName: 'Related Module',
      description: 'API name of the related module, for example Contacts.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'retrieve_related',
      query: {
        id: assertRecordId({ value: propsValue.recordId }),
        relatedLabel: requiredText({ value: propsValue.relatedLabel, label: 'Relation Label' }),
        relatedType: assertModuleName(propsValue.relatedModule),
      },
    });
    const records = recordList(result);
    return { records, count: records.length };
  },
});
