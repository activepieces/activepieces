import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';
import FormData from 'form-data';

export const updateRag = createAction({
  auth: straicoAuth,
  name: 'update_rag',
  displayName: 'Update RAG',
  description: 'Update an existing RAG (Retrieval-Augmented Generation) base with additional files.',
  props: {
    ragId: Property.ShortText({
      displayName: 'RAG ID',
      required: true,
      description: 'The ID of the RAG base to update.',
    }),
    file: Property.File({
			displayName: 'File',
			required: true,
			description:
				'Represents the file to be attached. Accepted file extensions are: pdf, docx, csv, txt, xlsx, py.',
		}),
  },
  async run({ auth, propsValue }) {
    const { ragId, file } = propsValue;

    if (!ragId) {
      throw new Error('RAG ID is required');
    }

    const formData = new FormData();
    formData.append('files', file.data, file.filename);

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: {
        _id: string;
        user_id: string;
        name: string;
        description: string;
        rag_url: string;
        original_filename: string;
        chunking_method: string;
        chunk_size: number;
        chunk_overlap: number;
        buffer_size: number;
        breakpoint_threshold_type: string;
        separator: string;
        separators: string[];
        createdAt: string;
        updatedAt: string;
        __v: number;
      };
      total_coins: number;
      total_words: number;
    }>({
      url: `${baseUrlv0}/rag/${ragId}`,
      method: HttpMethod.PUT,
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
