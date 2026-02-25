import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const createMemory = createAction({
  auth: goodmemAuth,
  name: 'create_memory',
  displayName: 'Create Memory',
  description: 'Store a document as a new memory in a space. The memory is processed asynchronously - chunked into searchable pieces and embedded into vectors. Accepts a file or plain text.',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The UUID of the space to store the memory in (returned by Create Space)',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'A file to store as memory (PDF, DOCX, image, etc.). Connect the output of a trigger or action that provides a file. Content type is auto-detected from the file extension.',
      required: false,
    }),
    textContent: Property.LongText({
      displayName: 'Text Content',
      description: 'Plain text content to store as memory (sent as text/plain). If both File and Text Content are provided, the file takes priority.',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where this memory came from (e.g., "google-drive", "gmail", "manual upload"). Stored in metadata.source',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'The author or creator of the content. Stored in metadata.author',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tags for categorization (e.g., "legal,research,important"). Stored in metadata.tags as an array',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Additional Metadata',
      description: 'Extra key-value metadata as JSON. Merged with Source, Author, and Tags fields above',
      required: false,
    }),
  },
  async run(context) {
    const { spaceId, file, textContent, source, author, tags, metadata } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    const requestBody: any = {
      spaceId,
    };

    if (file && file.base64) {
      // File provided — auto-detect content type from extension
      const detectedMimeType = file.extension
        ? getMimeType(file.extension)
        : null;
      const mimeType = detectedMimeType || 'application/octet-stream';

      // For text file types, decode base64 and send as originalContent
      if (mimeType.startsWith('text/')) {
        const decoded = Buffer.from(file.base64, 'base64').toString('utf-8');
        requestBody.contentType = mimeType;
        requestBody.originalContent = decoded;
      } else {
        // For binary types (PDF, images, etc.), send as base64
        requestBody.contentType = mimeType;
        requestBody.originalContentB64 = file.base64;
      }
    } else if (textContent) {
      // Plain text provided
      requestBody.contentType = 'text/plain';
      requestBody.originalContent = textContent;
    } else {
      return {
        success: false,
        error: 'No content provided. Please provide a file or text content.',
      };
    }

    const mergedMetadata: any = {};
    if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
      Object.assign(mergedMetadata, metadata);
    }
    if (source) {
      mergedMetadata.source = source;
    }
    if (author) {
      mergedMetadata.author = author;
    }
    if (tags) {
      mergedMetadata.tags = tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    }
    if (Object.keys(mergedMetadata).length > 0) {
      requestBody.metadata = mergedMetadata;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/v1/memories`,
        headers: getCommonHeaders(apiKey),
        body: requestBody,
      });

      return {
        success: true,
        memoryId: response.body.memoryId,
        spaceId: response.body.spaceId,
        status: response.body.processingStatus || 'PENDING',
        contentType: requestBody.contentType,
        fileName: file?.filename || null,
        message: 'Memory created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create memory',
        details: error.response?.body || error,
      };
    }
  },
});

function getMimeType(extension: string): string | null {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    txt: 'text/plain',
    html: 'text/html',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeTypes[extension.toLowerCase().replace('.', '')] || null;
}
