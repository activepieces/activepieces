import { createAction, Property } from '@activepieces/pieces-framework';
import { MagicSlidesAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPptFromTopic = createAction({
  auth: MagicSlidesAuth,
  name: 'createPptFromTopic',
  displayName: 'Create PPT from Topic',
  description: 'Generates a PPT presentation from a given topic.',
  props: {
    topic: Property.ShortText({
      displayName: "Topic",
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
    const { topic, number_of_slides, language, template_id, include_images } =
      context.propsValue;

    const payload: any = {
      topic,
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
      '/ppt_from_topic',
      payload
    );

    return result;
  },
});
