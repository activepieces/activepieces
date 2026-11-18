import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioPreviewImportRowOutputSchema } from '../../../output-schemas';

export const previewImportRowAction = createAction({
  auth: podioAuth,
  name: 'podio_preview_import_row',
  outputSchema: podioPreviewImportRowOutputSchema,
  displayName: 'Preview Import Row',
  description: 'Shows how one row of a file would be imported into an app, without importing it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Shows the field values and tags one row of an uploaded file would get when imported into a Podio app with the given mappings, without creating anything; use it to check mappings before Import App Items. The file id comes from Upload File, column ids and the row count from Get Import File Info.',
    idempotent: true,
  },
  props: {
    fileId: podioAiProps.id({ required: true, displayName: 'File ID', description: 'The id of the uploaded CSV or Excel file, from Upload File.' }),
    row: podioAiProps.number({ required: true, displayName: 'Row', description: 'The row of the file to preview, below the row_count from Get Import File Info.' }),
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to import into, from List Apps or Get App.' }),
    mappings: podioAiProps.idList({
      required: true,
      displayName: 'Mappings',
      description:
        'One object per app field: {"field_id": <app field id from Get App>, "unique": <true if the value identifies the item>, "value": <mapping>}. For most fields the mapping is {"column_id": <column id from Get Import File Info>}; date: {"start_column_id", "stop_column_id", "day_first"}; money: {"value_column_id", "currency_column_id", "currency_default"}; email: {<column id>: "home"|"work"|"other"}; phone: {<column id>: "mobile"|"work"|"home"|"main"|"work_fax"|"private_fax"|"other"}.',
    }),
    tagsColumnId: podioAiProps.text({ required: false, displayName: 'Tags Column ID', description: 'The id of the column to read tags from, from Get Import File Info.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/importer/${propsValue.fileId}/preview/${propsValue.row}`,
      body: podioUtils.body({ values: { app_id: Number(propsValue.appId), mappings: propsValue.mappings, tags_column_id: propsValue.tagsColumnId } }),
    });
  },
});
