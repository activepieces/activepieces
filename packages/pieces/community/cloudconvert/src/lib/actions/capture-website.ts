import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { cloudConvertApiService } from '../common/api';

export const captureWebsite = createAction({
  auth: cloudconvertAuth,
  name: 'capture_website',
  displayName: 'Capture a Website',
  description: 'Capture a webpage as a PDF, PNG, or JPG from a URL.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the webpage to capture.',
      required: true,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'The desired output format for the capture.',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
        ],
      },
    }),
  },

  async run({ auth, propsValue }) {
    const { url, output_format } = propsValue;

    return await cloudConvertApiService.capture(auth, {
      url: url as string,
      output_format: output_format as string,
    });
  },
});
