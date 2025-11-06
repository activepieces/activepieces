import { slidespeakAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL } from '../common/constants';

export const createPresentationAction = createAction({
  auth: slidespeakAuth,
  name: 'create-presentation',
  displayName: 'Create Presentation',
  description: 'Creates a new presentation.',
  props: {
    plain_text: Property.ShortText({
      displayName: 'Topic',
      description: 'Topic of presentation.',
      required: true,
    }),
    length: Property.Number({
      displayName: 'Number of Slides',
      required: false,
    }),
    document_uuids: Property.Array({
      displayName: 'Documents',
      description: 'Uploaded docuemts to use in presentation.',
      required: false,
    }),
    template: Property.Dropdown({
      displayName: 'Dropdown',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<{ name: string }[]>({
          method: HttpMethod.GET,
          url: BASE_URL + '/presentation/templates',
          headers: {
            'X-API-key': auth as string,
          },
        });

        return {
          disabled: false,
          options: response.body.map((template) => {
            return {
              label: template.name,
              value: template.name,
            };
          }),
        };
      },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      required: false,
    }),
    custom_user_instructions: Property.LongText({
      displayName: 'Custom User Instructions',
      required: false,
    }),
    fetch_images: Property.Checkbox({
      displayName: 'Fetch Images',
      description: 'Whether to include stock images.',
      required: false,
    }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      description: 'The tone to use for the text.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'default', value: 'default' },
          { label: 'casual', value: 'casual' },
          { label: 'professional', value: 'professional' },
          { label: 'funny', value: 'funny' },
          { label: 'educational', value: 'educational' },
          { label: 'sales_pitch', value: 'sales_pitch' },
        ],
      },
    }),
    verbosity: Property.StaticDropdown({
      displayName: 'Verbosity',
      description: 'How verbose, or long, the text should be.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'concise', value: 'concise' },
          { label: 'standard', value: 'standard' },
          { label: 'text-heavy', value: 'text-heavy' },
        ],
      },
    }),
    include_cover: Property.Checkbox({
      displayName: 'include the ‘cover’ slide.',
      required: false,
    }),
    include_table_of_contents: Property.Checkbox({
      displayName: ' include the ‘table of contents’ slides.',
      required: false,
    }),
    response_format: Property.StaticDropdown({
      displayName: 'Response Format',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'powerpoint', value: 'powerpoint' },
          { label: 'pdf', value: 'pdf' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      plain_text,
      length,
      document_uuids,
      template,
      language,
      fetch_images,
      tone,
      verbosity,
      include_cover,
      response_format,
      include_table_of_contents,
      custom_user_instructions,
    } = context.propsValue;
    const apiKey = context.auth;

    const response = await httpClient.sendRequest<{ task_id: string }>({
      method: HttpMethod.POST,
      url: BASE_URL + '/presentation/generate',
      headers: {
        'X-API-key': apiKey,
      },
      body: {
        plain_text,
        length,
        document_uuids,
        template,
        language,
        fetch_images,
        tone,
        verbosity,
        include_cover,
        include_table_of_contents,
        response_format,
        custom_user_instructions,
      },
    });

    if (!response || !response.body.task_id) {
      throw new Error('Failed to create presentation.');
    }

    let status = 'FAILURE';
    const timeoutAt = Date.now() + 5 * 60 * 1000;
    const taskId = response.body.task_id;

    do {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const pollRes = await httpClient.sendRequest<{
        task_id: string;
        task_status: string;
      }>({
        method: HttpMethod.GET,
        url: BASE_URL + `/task_status/${taskId}`,
        headers: {
          'X-API-key': apiKey,
        },
      });

      status = pollRes.body.task_status;

      if (status === 'SUCCESS') return pollRes.body;
    } while (status !== 'SUCCESS' && Date.now() < timeoutAt);

    throw new Error('Create resentation timed out or failed.');
  },
});
