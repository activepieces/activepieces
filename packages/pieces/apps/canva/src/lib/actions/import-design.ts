import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const importDesignAction = createAction({
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import a design from a URL (e.g., PDF) into Canva.',
  props: {
    sourceUrl: Property.ShortText({
      displayName: 'Source URL',
      description: 'The URL of the file (e.g., PDF) to import.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'The title for the new imported design.',
      required: true,
    }),
    folderId: { ...canvaCommon.folderId, required: false },
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { sourceUrl, title, folderId } = propsValue;

    const body: Record<string, any> = {
      source_url: sourceUrl,
      title: title,
    };

    if (folderId) {
        body.folder_id = folderId;
    }

    // Assuming an import endpoint exists. This might involve a multi-step process
    // (e.g., upload file, then convert) depending on the actual Canva API.
    // This example uses a simplified direct import endpoint.
    const response = await canvaCommon.makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/designs/import', // Hypothetical endpoint
      body
    );

    return {
      designId: response.id,
      designUrl: response.edit_url,
      message: 'Design imported successfully.',
      data: response,
    };
  },
});
