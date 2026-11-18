import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas, spaceIdDropdown } from '../common';
import { goodmemApi, goodmemBuilders } from '../common/client';

export const createMemory = createAction({
  auth: goodmemAuth,
  name: 'create_memory',
  classification: 'WRITE',
  displayName: 'Create Memory',
  description: 'Store a document as a new memory in a space. The memory is processed asynchronously - chunked into searchable pieces and embedded into vectors. Accepts a file or plain text.',
  audience: 'human',
  outputSchema: goodmemOutputSchemas.memory,
  props: {
    spaceId: spaceIdDropdown,
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
    const auth = extractAuthFromContext(context.auth);
    const body = goodmemBuilders.buildMemoryRequestBody({
      spaceId: goodmemBuilders.requireText({ value: spaceId, label: 'Space' }),
      file: file ? { base64: file.base64, extension: file.extension, filename: file.filename } : null,
      textContent: textContent ?? undefined,
      metadata: goodmemBuilders.buildMemoryMetadata({
        source: source ?? undefined,
        author: author ?? undefined,
        tags: tags ?? undefined,
        metadata,
      }),
    });
    return goodmemApi.createMemoryRequest({ auth, body });
  },
});
