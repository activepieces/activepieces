import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { MagicSlidesAuth } from '../common/auth';


export const createPptFromSummary = createAction({
  auth: MagicSlidesAuth,
  name: 'createPptFromText',
  displayName: 'Create PPT from Text/Summary',
  description: 'Generates a PPT presentation from provided text or summary.',
  props: {
    summary: Property.LongText({
      displayName: "Text / Summary",
      required: true,
    }),
    number_of_slides: Property.Number({
      displayName: "Number of slides",
      required: false,
      defaultValue: 10,
    }),
    language: Property.ShortText({
      displayName: "Language",
      required: false,
      defaultValue: "en",
    }),
    template_id: Property.ShortText({
      displayName: "Template ID (optional)",
      required: false,
    }),
    include_images: Property.Checkbox({
      displayName: "Include images",
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { summary, number_of_slides, language, template_id, include_images } =
      context.propsValue;

    const payload: any = {
      text: summary,
      number_of_slides,
      language,
      include_images,
    };
    if (template_id) {
      payload.template_id = template_id;
    }

    const result = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/text',
      payload
    );

    return result;
  },
});

