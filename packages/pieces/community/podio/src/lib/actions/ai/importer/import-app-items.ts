import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioExportItemsOutputSchema } from '../../../output-schemas';

export const importAppItemsAction = createAction({
  auth: podioAuth,
  name: 'podio_import_app_items',
  outputSchema: podioExportItemsOutputSchema,
  displayName: 'Import App Items',
  description: 'Starts importing the rows of a file as items of an app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts importing every row of an uploaded CSV or Excel file as items of one Podio app and returns the batch_id; poll Get Batch with it until the status is "completed" or "failed". Repeating it imports the rows again. Check the mappings first with Preview Import Row. The file id comes from Upload File, column ids from Get Import File Info.',
    idempotent: false,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the uploaded CSV or Excel file, from Upload File.' }),
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to import into, from List Apps or Get App.' }),
    mappings: podioAiProps.idList({
      required: true,
      displayName: 'Mappings',
      description:
        'One object per app field: {"field_id": <app field id from Get App>, "unique": <true if the value identifies the item>, "value": <mapping>}. For most fields the mapping is {"column_id": <column id from Get Import File Info>}; date: {"start_column_id", "stop_column_id", "day_first"}; money: {"value_column_id", "currency_column_id", "currency_default"}; email: {<column id>: "home"|"work"|"other"}; phone: {<column id>: "mobile"|"work"|"home"|"main"|"work_fax"|"private_fax"|"other"}.',
    }),
    tagsColumnId: podioAiProps.text({ required: false, displayName: 'Tags Column ID', description: 'The id of the column to read tags from, from Get Import File Info.' }),
    appItemIdColumnId: podioAiProps.text({ required: false, displayName: 'App Item ID Column ID', description: 'The id of the column holding the app item id of each row, from Get Import File Info.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/importer/${propsValue.fileId}/item/app/${propsValue.appId}`,
      body: podioUtils.body({
        values: {
          app_id: Number(propsValue.appId),
          mappings: propsValue.mappings,
          tags_column_id: propsValue.tagsColumnId,
          app_item_id_column_id: propsValue.appItemIdColumnId,
        },
      }),
    });
  },
});
