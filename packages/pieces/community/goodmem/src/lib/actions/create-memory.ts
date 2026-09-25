import { createAction, Property } from '@activepieces/pieces-framework';
import { createGoodmemClient } from '../client';
import { goodmemAuth } from '../auth';
import { waitForMemory } from '../indexing';
import { spaceIdDropdown } from '../common';

export const createMemory = createAction({
  auth: goodmemAuth,
  name: 'create_memory',
  displayName: 'Create Memory',
  description:
    'Store a document as a new memory in a space. The memory is processed asynchronously - chunked into searchable pieces and embedded into vectors. Accepts a file or plain text.',
  audience: 'both',
  aiMetadata: {
    description:
      'Stores content as a new memory in a GoodMem space, which is then chunked and embedded asynchronously for later semantic retrieval. Provide the content either as a file or as plain text (the file takes priority when both are given), along with the target space ID. Use it to ingest documents into a memory store. Not idempotent: each call creates a separate memory, so repeated calls produce duplicates.',
    idempotent: false,
  },
  props: {
    spaceId: spaceIdDropdown,
    file: Property.File({
      displayName: 'File',
      description:
        'A file to store as memory (PDF, DOCX, image, etc.). Connect the output of a trigger or action that provides a file. Content type is auto-detected from the file extension.',
      required: false,
    }),
    textContent: Property.LongText({
      displayName: 'Text Content',
      description:
        'Plain text content to store as memory (sent as text/plain). If both File and Text Content are provided, the file takes priority.',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description:
        'Where this memory came from (e.g., "google-drive", "gmail", "manual upload"). Stored in metadata.source',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description:
        'The author or creator of the content. Stored in metadata.author',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description:
        'Comma-separated tags for categorization (e.g., "legal,research,important"). Stored in metadata.tags as an array',
      required: false,
    }),
    waitForIndexing: Property.Checkbox({
      displayName: 'Wait for Indexing',
      description:
        'Wait for this memory to finish processing before the next step. Its ID is returned even if processing fails or the wait expires.',
      required: false,
      defaultValue: true,
    }),
    indexingTimeout: Property.Number({
      displayName: 'Indexing Timeout (seconds)',
      description:
        'Maximum time to wait for this memory, from 1 to 300 seconds.',
      required: false,
      defaultValue: 60,
    }),
    metadata: Property.Json({
      displayName: 'Additional Metadata',
      description:
        'Extra key-value metadata as JSON. Merged with Source, Author, and Tags fields above',
      required: false,
    }),
  },
  async run(context) {
    const {
      spaceId,
      file,
      textContent,
      source,
      author,
      tags,
      metadata,
      waitForIndexing = true,
      indexingTimeout = 60,
    } = context.propsValue;
    if (
      waitForIndexing &&
      (!Number.isFinite(indexingTimeout) ||
        indexingTimeout < 1 ||
        indexingTimeout > 300)
    ) {
      throw new Error('Indexing timeout must be between 1 and 300 seconds.');
    }
    if (
      metadata !== undefined &&
      metadata !== null &&
      (typeof metadata !== 'object' || Array.isArray(metadata))
    ) {
      throw new Error('Additional metadata must be a JSON object.');
    }
    const mergedMetadata: Record<string, unknown> = {
      ...metadata,
      ...(file?.filename ? { filename: file.filename } : {}),
      ...(source ? { source } : {}),
      ...(author ? { author } : {}),
      ...(tags
        ? {
            tags: tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          }
        : {}),
    };
    const client = createGoodmemClient(context.auth.props);
    let memory;
    if (file) {
      memory = await client.memories.createFromBytes({
        spaceId,
        bytes: file.data,
        filename: file.filename,
        contentType:
          getMimeType(file.extension ?? '') ?? 'application/octet-stream',
        metadata: mergedMetadata,
      });
    } else if (textContent?.trim()) {
      memory = await client.memories.create({
        spaceId,
        originalContent: textContent,
        metadata: mergedMetadata,
      });
    } else {
      throw new Error('Provide a file or text content.');
    }
    const indexed = waitForIndexing
      ? await waitForMemory({
          client,
          memory,
          timeoutMs: indexingTimeout * 1000,
        })
      : { memory, timedOut: false, indexingError: undefined };
    const ready = indexed.memory.processingStatus === 'COMPLETED';
    return {
      ...indexed.memory,
      indexing: {
        ready,
        status: indexed.memory.processingStatus,
        timedOut: indexed.timedOut,
      },
      ...(waitForIndexing && !ready ? { partial: true } : {}),
      ...(indexed.indexingError
        ? { indexingError: indexed.indexingError }
        : {}),
    };
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
