import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';
import FormData from 'form-data';

export const createRag = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'create_rag',
  displayName: 'Create RAG',
  description: 'Create a searchable knowledge base (RAG) from a file.',
  aiMetadata: { description: 'Ingests one uploaded document into a brand new RAG knowledge base that can then be queried with RAG Prompt Completion or attached to an agent, chunking it by fixed size, recursive, markdown, python or semantic strategy. Use it to stand up a new searchable corpus; prefer Update RAG to add another file to a base that already exists, and Upload File when the document only needs a URL to pass into Ask AI rather than being indexed. Requires a name, a description and a file (pdf, docx, csv, txt, xlsx or py); the chunking options apply only to the matching method. Not idempotent: each call creates another RAG base and consumes credits for the ingest.', idempotent: false },
  propertyGroups: [
    {
      key: 'base',
      display: 'section',
      label: 'Knowledge Base',
      icon: 'file',
      props: ['name', 'description', 'file'],
    },
    {
      key: 'chunking',
      display: 'section',
      label: 'Chunking',
      icon: 'sliders',
      props: ['chunkingMethod', 'chunkSize', 'chunkOverlap'],
    },
    {
      key: 'method',
      display: 'section',
      label: 'Method Options',
      icon: 'filter',
      props: ['separator', 'separators', 'breakpointThresholdType', 'bufferSize'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'A name to find the knowledge base by.',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
      description: 'What the knowledge base contains.',
    }),
    file: Property.File({
			displayName: 'File',
			required: true,
			description: 'A PDF, DOCX, CSV, TXT, XLSX or PY file.',
		}),
    chunkingMethod: Property.Dropdown({
  auth: straicoAuth,

      displayName: 'Chunking Method',
      required: false,
      description: 'How the file is split into pieces. Empty: Fixed Size.',
      defaultValue: 'fixed_size',
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Fixed Size', value: 'fixed_size' },
            { label: 'Recursive', value: 'recursive' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'Python', value: 'python' },
            { label: 'Semantic', value: 'semantic' },
          ],
          disabled: false
        };
      },
    }),
    chunkSize: Property.Number({
      displayName: 'Chunk Size',
      required: false,
      width: 'half',
      description: 'Characters per piece.',
      defaultValue: 1000,
    }),
    chunkOverlap: Property.Number({
      displayName: 'Chunk Overlap',
      required: false,
      width: 'half',
      description: 'Characters shared between pieces.',
      defaultValue: 50,
    }),
    separator: Property.ShortText({
      displayName: 'Separator',
      required: false,
      description: 'Fixed Size only. Text to split on.'
    }),
    separators: Property.Array({
      displayName: 'Separators',
      required: false,
      description: 'Recursive only. Texts to split on, tried in order.'
    }),
    breakpointThresholdType: Property.StaticDropdown({
      displayName: 'Breakpoint Type',
      required: false,
      width: 'half',
      description: 'Semantic only.',
      options: {
        disabled: false,
          options: [
            { label: 'Percentile', value: 'percentile' },
            { label: 'Interquartile', value: 'interquartile' },
            { label: 'Standard Deviation', value: 'standard_deviation' },
            { label: 'Gradient', value: 'gradient' },
          ],
        
      },
    }),
    bufferSize: Property.Number({
      displayName: 'Buffer Size',
      required: false,
      width: 'half',
      description: 'Semantic only. Sentences grouped per comparison.'
    }),
  },
  async run({ auth, propsValue }) {
    const { file, chunkingMethod, chunkSize, chunkOverlap, separator, separators, breakpointThresholdType, bufferSize } = propsValue;

    const formData = new FormData();
    formData.append('name', propsValue.name);
    formData.append('description', propsValue.description);
    formData.append('files', file.data, file.filename);

    if (chunkingMethod) {
      formData.append('chunking_method', chunkingMethod);
    }

    if (chunkSize !== undefined) {
      formData.append('chunk_size', chunkSize.toString());
    }

    if (chunkOverlap !== undefined) {
      formData.append('chunk_overlap', chunkOverlap.toString());
    }

    if (separator && separator.trim() !== '') {
      formData.append('separator', separator);
    }

    if (separators && separators.length > 0) {
      for (const separator of separators as string[]) {
        formData.append('separators', separator);
      }
    }
    
    if (breakpointThresholdType) {
      formData.append('breakpoint_threshold_type', breakpointThresholdType);
    }
    
    if (bufferSize !== undefined) {
      formData.append('buffer_size', bufferSize.toString());
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: {
        _id: string;
        user_id: string;
        name: string;
        rag_url: string;
        original_filename: string;
        chunking_method: string;
        chunk_overlap: number;
        created_at: string;
      };
      total_coins: number;
      total_words: number;
    }>({
      url: `${baseUrlv0}/rag`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.body;
  },
});