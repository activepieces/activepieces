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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Your registered MagicSlides email address.',
      required: true,
    }),
    slideCount: Property.Number({
      displayName: "Number of slides",
      required: false,
      defaultValue: 10,
    }),
    language: Property.StaticDropdown({
      displayName: "Language",
      required: false,
      defaultValue: "en",
      options: {
        options: [
          { label: "English", value: "en" },
          { label: "Hindi", value: "hi" },
          { label: "Spanish", value: "es" },
          { label: "French", value: "fr" },
          { label: "German", value: "de" },
          { label: "Chinese", value: "zh" },
        ],
      },
    }),
    template: Property.StaticDropdown({
      displayName: "Template",
      required: false,
      defaultValue: "bullet-point1",
      options: {
        options: [
          { label: "Bullet Point 1 (default)", value: "bullet-point1" },
          { label: "Bullet Point 2", value: "bullet-point2" },
          { label: "Bullet Point 4", value: "bullet-point4" },
          { label: "Bullet Point 5", value: "bullet-point5" },
          { label: "Bullet Point 6", value: "bullet-point6" },
          { label: "Bullet Point 7", value: "bullet-point7" },
          { label: "Bullet Point 8", value: "bullet-point8" },
          { label: "Bullet Point 9", value: "bullet-point9" },
          { label: "Bullet Point 10", value: "bullet-point10" },
          { label: "Pitch Deck Original", value: "pitchdeckorignal" },
          { label: "Pitch Deck 2", value: "pitch-deck-2" },
          { label: "Pitch Deck 3", value: "pitch-deck-3" },
          { label: "Custom 2", value: "custom2" },
          { label: "Custom 3", value: "custom3" },
          { label: "Vertical Bullet Point 1", value: "verticalBulletPoint1" },
          { label: "Vertical Custom 1", value: "verticalCustom1" },
        ],
      },
    }),
    model: Property.StaticDropdown({
      displayName: "AI Model",
      required: false,
      defaultValue: "gpt-4",
      options: {
        options: [
          { label: "GPT-4", value: "gpt-4" },
          { label: "GPT-3.5", value: "gpt-3.5" },
        ],
      },
    }),
    aiImages: Property.Checkbox({
      displayName: "Use AI Images",
      required: false,
      defaultValue: false,
    }),
    imageForEachSlide: Property.Checkbox({
      displayName: "Image for Each Slide",
      required: false,
      defaultValue: true,
    }),
    googleImage: Property.Checkbox({
      displayName: "Use Google Images",
      required: false,
      defaultValue: false,
    }),
    googleText: Property.Checkbox({
      displayName: "Use Google Text",
      required: false,
      defaultValue: false,
    }),
    include_images: Property.Checkbox({
      displayName: "Include images",
      required: false,
      defaultValue: true,
    }),
    presentationFor: Property.ShortText({
      displayName: "Presentation For (Audience)",
      required: false,
    }),
    watermark: Property.Json({
      displayName: 'Watermark',
      description: 'Add a watermark to the presentation. e.g., {"width": "48", "height": "48", "brandURL": "https://...png", "position": "BottomRight"}',
      required: false,
    }),

  },
  async run(context) {
    const {
      topic,
      email,
      slideCount,
      language,
      template,
      model,
      aiImages,
      imageForEachSlide,
      googleImage,
      googleText,
      presentationFor,
      watermark,
    } = context.propsValue;

    const auth = context.auth ;

    const payload: any = {
      topic,
      email,
      accessId: auth as string,
      slideCount,
      language,
      template,
      model,
      aiImages,
      imageForEachSlide,
      googleImage,
      googleText,
      presentationFor,
      watermark,

    };

    const result = await makeRequest(

      HttpMethod.POST,
      '/ppt_from_topic',
      payload
    );

    return result;
  },
});