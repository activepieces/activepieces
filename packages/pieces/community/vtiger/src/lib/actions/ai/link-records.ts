import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp, requiredText } from '../../ai-common';
import { linkResultSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export function linkForm({
  sourceRecordId,
  relatedRecordId,
  relationLabel,
}: {
  sourceRecordId: unknown;
  relatedRecordId: unknown;
  relationLabel: unknown;
}): Record<string, string> {
  return {
    sourceRecordId: assertRecordId({ value: sourceRecordId, label: 'Source Record ID' }),
    relatedRecordId: assertRecordId({ value: relatedRecordId, label: 'Related Record ID' }),
    relationIdLabel: requiredText({ value: relationLabel, label: 'Relation Label' }),
  };
}

export const linkRecordsAction = createAction({
  auth: vtigerAuth,
  name: 'link_records',
  displayName: 'Link Records',
  description: 'Adds a record to a related list of another record.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Links two existing records through a relation, e.g. adds a Contact to an Account or a Document to a Ticket. Take the relation label from List Relation Types for the source module. Linking a pair that is already linked succeeds and changes nothing.',
    idempotent: true,
  },
  outputSchema: linkResultSchema,
  props: {
    sourceRecordId: recordIdProp({ displayName: 'Source Record ID', description: 'Webservice ID of the parent record.' }),
    relatedRecordId: recordIdProp({ displayName: 'Related Record ID', description: 'Webservice ID of the record to add.' }),
    relationLabel: Property.ShortText({
      displayName: 'Relation Label',
      description: 'Relation label from List Relation Types, for example Contacts.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = linkForm(propsValue);
    const result = await vtigerRest<unknown>({ creds: auth.props, method: HttpMethod.POST, path: 'add_related', form });
    return {
      sourceRecordId: form['sourceRecordId'],
      relatedRecordId: form['relatedRecordId'],
      relationLabel: form['relationIdLabel'],
      linked: true,
      result,
    };
  },
});
