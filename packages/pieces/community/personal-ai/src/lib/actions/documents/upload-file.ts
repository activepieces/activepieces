import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { personalAiAuth } from '../../auth';
import { BASE_URL } from '../../../index';

export const uploadFile = createAction({
  auth:personalAiAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to AI assistant.',
  audience: 'both',
  aiMetadata: { description: 'Upload a binary file (sent as multipart form data) to the Personal AI assistant so it can reference the content, with optional tags, source, and add-to-memory flag. Use when the source is an actual file; use Upload Document for plain text or Upload URL Content to fetch from a link. Each call creates a new uploaded file, so it is not idempotent.', idempotent: false },
  // category: 'Documents',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the file to be uploaded',
      required: true,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain identifier for the AI profile',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma delimited list of tags for the file',
      required: false,
    }),
    sourceName: Property.ShortText({
      displayName: 'Source Name',
      description: 'Name of the source or application',
      required: false,
    }),
    createdTime: Property.ShortText({
      displayName: 'Created Time',
      description: 'Time (including timezone) of the file creation (e.g., Wed, 19 Sep 2023 13:31:00 PDT)',
      required: false,
    }),
    isStack: Property.Checkbox({
      displayName: 'Add to Memory',
      description: 'Flag to also add the file content to memory',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue: { file, fileName, domainName, tags, sourceName, createdTime, isStack } } = context;

    // Create form data for file upload
    const formData = new FormData();
    const blob = new Blob([file.data as any], { type: 'application/octet-stream' });
    formData.append('file', blob, fileName);
    if (domainName) formData.append('DomainName', domainName);
    if (tags) formData.append('Tags', tags);
    if (sourceName) formData.append('SourceName', sourceName);
    if (createdTime) formData.append('CreatedTime', createdTime);
    if (isStack !== undefined) formData.append('is_stack', isStack.toString());

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/upload-file`,
      headers: {
        'x-api-key': auth.secret_text as string,
      },
      body: formData,
    });

    return response.body;
  },
});
