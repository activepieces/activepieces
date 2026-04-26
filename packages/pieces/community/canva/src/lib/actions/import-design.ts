import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description:
    'Import a file (PDF, PPTX, etc.) into Canva as an editable design. Returns a job ID to track the import progress.',
  props: {
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'The title for the imported design.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'File URL',
      description: 'Publicly accessible URL of the file to import into Canva.',
      required: true,
    }),
    mimeType: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'The MIME type of the file being imported.',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'application/pdf' },
          { label: 'PowerPoint (PPTX)', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { label: 'Word (DOCX)', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        ],
      },
    }),
  },
  async run(context) {
    const { title, url, mimeType } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const body: Record<string, unknown> = {
      title,
      asset: {
        name: title,
        url,
        mime_type: mimeType,
      },
    };

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.POST,
      path: '/imports',
      body,
    });

    return response;
  },
});
