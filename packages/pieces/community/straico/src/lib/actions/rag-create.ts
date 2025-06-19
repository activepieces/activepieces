import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';
import FormData from 'form-data';

export const createRag = createAction({
  auth: straicoAuth,
  name: 'create_rag',
  displayName: 'Create RAG',
  description: 'Create a new RAG (Retrieval-Augmented Generation) base in the database.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'Represents the name of the RAG base',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
      description: 'Represents the description of the agent',
    }),
    file: Property.File({
			displayName: 'File',
			required: true,
			description:
				'Represents the file to be attached. Accepted file extensions are: pdf, docx, csv, txt, xlsx, py',
		}),
    chunkingMethod: Property.Dropdown({
      displayName: 'Chunking Method',
      required: false,
      description: 'Represents the chunking method to be used for generating the RAG base. The default value is fixed_size',
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
      description: 'The size of each chunk (default: 1000)',
      defaultValue: 1000,
    }),
    chunkOverlap: Property.Number({
      displayName: 'Chunk Overlap',
      required: false,
      description: 'The overlap between chunks (default: 50)',
      defaultValue: 50,
    }),
    separator: Property.ShortText({
      displayName: 'Separator',
      required: false,
      description: 'The separator to use for fixed_size chunking method'
    }),
    separators: Property.Array({
      displayName: 'Separators',
      required: false,
      description: 'The separators to use for recursive chunking method'
    }),
    breakpointThresholdType: Property.StaticDropdown({
      displayName: 'Breakpoint Threshold Type',
      required: false,
      description: 'The breakpoint threshold type for semantic chunking method',
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
      description: 'The buffer size for semantic chunking method'
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
        token: auth as string,
      },
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.body;
  },
});