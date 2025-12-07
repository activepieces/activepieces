import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Convert PDFs into editable designs',
  props: {
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the imported design (max 50 characters)',
      required: true,
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'URL of the PDF file to import',
      required: true,
    }),
    mime_type: Property.ShortText({
      displayName: 'MIME Type',
      description: 'File MIME type (e.g., application/pdf)',
      required: false,
      defaultValue: 'application/pdf',
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const title = context.propsValue.title;
    const fileUrl = context.propsValue.file_url;
    const mimeType = context.propsValue.mime_type;

    // Download the file first
    const fileResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: fileUrl,
    });

    // Encode title in base64
    const titleBase64 = Buffer.from(title).toString('base64');

    // Build metadata
    const metadata: any = {
      title_base64: titleBase64,
    };

    if (mimeType) {
      metadata.mime_type = mimeType;
    }

    // Import the design
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${canvaCommon.baseUrl}/${canvaCommon.imports}`,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Import-Metadata': JSON.stringify(metadata),
      },
      body: fileResponse.body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      job: response.body,
    };
  },
});
