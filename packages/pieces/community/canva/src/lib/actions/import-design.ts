import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import a design from a file (PDF, PPTX, etc.) into Canva',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to import (PDF, PPTX, DOCX supported)',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the imported design',
      required: true,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the folder to import the design into',
      required: false,
    }),
    convertToEditable: Property.Checkbox({
      displayName: 'Convert to Editable',
      description: 'Convert imported content to editable Canva elements',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { file, title, folderId, convertToEditable } = context.propsValue;
    
    try {
      //upload the file
      const uploadResult = await canvaCommon.uploadFile(
        context.auth,
        file.data,
        file.filename,
        file.extension
      );
      //import it as a design
      const importData = {
        title: title,
        asset_id: uploadResult.asset.id,
        folder_id: folderId,
        convert_to_editable: convertToEditable,
      };

      const result = await canvaCommon.makeRequest(
        context.auth,
        'POST',
        '/designs/import',
        importData
      );

      return {
        success: true,
        design: result.design,
        editUrl: result.design.urls.edit_url,
        viewUrl: result.design.urls.view_url,
        importedPages: result.design.page_count,
        message: `Design "${title}" imported successfully with ${result.design.page_count} pages`,
      };
    } catch (error:any) {
      throw new Error(`Failed to import design: ${error.message}`);
    }
  },
});