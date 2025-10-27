import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { quickbaseAuth, QuickbaseAuth } from '../common/auth';

export const deleteRecord = createAction({
  auth: quickbaseAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Deletes a record from a Quickbase table',
  props: {
    tableId: Property.ShortText({
      displayName: 'Table ID',
      description: 'The ID of the Quickbase table containing the record',
      required: true,
    }),
    recordId: Property.Number({
      displayName: 'Record ID',
      description: 'The ID of the record to delete (field 3)',
      required: true,
    }),
  },
  async run(context) {
    const { tableId, recordId } = context.propsValue;
    const auth = context.auth as QuickbaseAuth;

    try {
      const response = await httpClient.sendRequest<{
        numberDeleted: number;
      }>({
        method: HttpMethod.DELETE,
        url: `https://api.quickbase.com/v1/records`,
        headers: {
          'QB-Realm-Hostname': auth.realm,
          Authorization: `QB-USER-TOKEN ${auth.userToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          from: tableId,
          where: `{3.EX.${recordId}}`, // Field 3 is the Record ID field
        },
      });

      const wasDeleted = response.body.numberDeleted > 0;

      return {
        success: true,
        deleted: wasDeleted,
        recordId: recordId,
        numberDeleted: response.body.numberDeleted,
        message: wasDeleted 
          ? `Successfully deleted record ${recordId}`
          : `Record ${recordId} was not found or could not be deleted`,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to delete record from Quickbase: ${error.response?.body?.message || error.message || 'Unknown error'}`
      );
    }
  },
});
