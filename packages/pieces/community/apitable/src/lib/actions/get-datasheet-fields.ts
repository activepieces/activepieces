import { createAction } from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { getDatasheetFieldsActionOutputSchema } from '../output-schemas';

export const getDatasheetFieldsAction = createAction({
  auth: APITableAuth,
  name: 'apitable_get_datasheet_fields',
  classification: 'READ',
  displayName: 'Get Datasheet Fields',
  description: 'Reads the field (column) definitions of a datasheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the field (column) definitions of an AITable datasheet, including each field\'s name, type, and the option list for select/member fields. Use before creating or updating records to learn the valid field names and choices for that datasheet. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
  },
  outputSchema: getDatasheetFieldsActionOutputSchema,
  async run(context) {
    const client = makeClient(context.auth.props);
    const response = await client.getDatasheetFields(
      context.propsValue.datasheet_id as string
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
