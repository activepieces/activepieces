import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { MagicSlidesAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { EmailType } from '@activepieces/shared';

export const createPptFromYoutubeVideo = createAction({
  auth: MagicSlidesAuth,
  name: 'createPptFromYoutube',
  displayName: 'Create PPT from YouTube Video',
  description: 'Generates a PPT presentation from a YouTube video link.',
  props: {
    youtubeURL: Property.ShortText({
      displayName: "YouTube Video URL",
      required: true,
    }),
    email: Property.ShortText({
         displayName: 'Email',
         description: 'Your registered MagicSlides email address.',
         required: false,
       }),
    template: Property.StaticDropdown({
      displayName: "Template",
      required: false,
      defaultValue: "bullet-point1",
      options: {
        options: [
          { label: "Bullet Point 1", value: "bullet-point1" },
          { label: "Bullet Point 2", value: "bullet-point2" },
          { label: "Bullet Point 4", value: "bullet-point4" },
          { label: "Pitch Deck 3", value: "pitch-deck-3" },
          { label: "Pitch Deck 2", value: "pitch-deck-2" },
          { label: "Custom Dark 1", value: "custom Dark 1" },
          { label: "Vertical Bullet Point 1", value: "verticalBulletPoint1" },
        ],
      },
    }),
    language: Property.ShortText({
      displayName: "Language",
      required: false,
      defaultValue: "en",
    }),
    slideCount: Property.Number({
      displayName: "Number of slides",
      required: false,
      defaultValue: 10,
    }),
    aiImages: Property.Checkbox({
      displayName: "Enable AI Images",
      required: false,
      defaultValue: false,
    }),
    imageForEachSlide: Property.Checkbox({
      displayName: "Include Image on Every Slide",
      required: false,
      defaultValue: true,
    }),
    googleImage: Property.Checkbox({
      displayName: "Use Google Images",
      required: false,
      defaultValue: false,
    }),
    googleText: Property.Checkbox({
      displayName: "Enhance Content with Google Search",
      required: false,
      defaultValue: false,
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
    presentationFor: Property.ShortText({
      displayName: "Presentation For (Audience)",
      required: false,
    }),
    watermark: Property.Json({
      displayName: 'Watermark',
      description:
        'Optional watermark e.g., {"width":"48","height":"48","brandURL":"https://...png","position":"BottomRight"}',
      required: false,
    }),
    
  },
  async run(context) {
    const {
      youtubeURL, template, language,
      slideCount, aiImages, imageForEachSlide, googleImage,
      googleText, model, presentationFor,
      watermark,email
    } = context.propsValue;
    const auth = context.auth
    const payload: any = {
      youtubeURL,

      template,
      language,
      slideCount,
      aiImages,
      imageForEachSlide,
      googleImage,
      googleText,
      model,
      presentationFor,
      watermark,
     email,
      accessId: auth,
    };
    return await makeRequest(

      HttpMethod.POST,
      '/ppt_from_youtube',
      payload
    );
  },
});