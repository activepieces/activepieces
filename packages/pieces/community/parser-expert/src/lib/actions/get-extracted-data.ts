import { createAction, Property } from '@activepieces/pieces-framework';
import { parserExpertAuth } from '../common/auth';
import { parserExpertCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getExtractedData = createAction({
  auth: parserExpertAuth,
  name: 'get_extracted_data',
  displayName: 'Get Extracted Data',
  description: 'Retrieve the extracted data using the parser ID and bucket ID. The parser ID is returned when you upload a document.',
  props: {
    parser_id: Property.ShortText({
      displayName: 'Parser ID',
      description: 'The ID of the parser. This is returned when content is uploaded.',
      required: true,
    }),
    bucket_id: Property.ShortText({
      displayName: 'Bucket ID',
      description: 'The ID of the bucket where the data is stored.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { parser_id, bucket_id } = propsValue;

    const response = await parserExpertCommon.apiCall<{
      data: Array<{
        parsed_data: Record<string, unknown>;
        parser_id: string;
        status: 'pending' | 'parsed' | 'error';
        updated_at: string;
      }>;
      message: string;
    }>({
      method: HttpMethod.GET,
      url: '/v1/extracts',
      auth: auth.secret_text,
      queryParams: {
        parser_id,
        bucket_id,
      },
    });

    return response;
  },
});

