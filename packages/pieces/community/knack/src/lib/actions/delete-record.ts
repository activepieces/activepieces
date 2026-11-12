import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { assertKnackDeleteConfirmed, knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import { objectDropdown } from '../common/props';
import { deleteRecordOutputSchema } from '../common/schemas';

export const deleteRecordAction = createAction({
  auth: knackAuth,
  name: 'delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Deletes an existing record from a table.',
  audience: 'both',
  outputSchema: deleteRecordOutputSchema,
  aiMetadata: {
    description: 'Permanently deletes a single record from a Knack object (table), identified by its record ID. Use when removing a known row. A record ID that does not exist returns a not-found error with the Knack message. Returns delete and deleted (both true) and the record ID. Not idempotent: the record is removed on the first successful call and repeating it fails.',
    idempotent: false,
  },
  props: {
    object: objectDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description: 'The ID of the record to delete.',
    }),
  },
  async run({ propsValue, auth }) {
    const { object: objectKey } = propsValue;
    const recordId = propsValue.recordId.trim();
    const response = await knackApiCall<Record<string, unknown>>({
      method: HttpMethod.DELETE,
      auth,
      resourceUri: `/objects/${encodeURIComponent(objectKey)}/records/${encodeURIComponent(recordId)}`,
    });
    assertKnackDeleteConfirmed({ response, recordId, objectKey });
    return { delete: true, deleted: true, id: recordId };
  },
});
