import { createAction, Property } from '@activepieces/pieces-framework';
import { magicslidesAuth } from '../common/auth'; 
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const createPptFromSummary = createAction({
  auth: magicslidesAuth,
  name: 'createPptFromSummary',
  displayName: 'Create PPT from Summary',
  description: 'Generates a PPT presentation from provided summary.',
  props: {
    msSummaryText: Property.LongText({
      displayName: 'Summary Text',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: ' registered MagicSlides email address.',
      required: true,
    }),
    slideCount: Property.Number({
      displayName: 'Number of Slides',
      required: false,
      defaultValue: 10,
    }),
    presentationFor: Property.ShortText({
      displayName: 'Presentation For (Audience)',
      required: false,
    }),
    template: Property.StaticDropdown({
      displayName: 'Template',
      required: false,
      defaultValue: 'bullet-point1',
      options: {
        options: [
          { label: 'Bullet Point 1 (default)', value: 'bullet-point1' },
          { label: 'Bullet Point 2', value: 'bullet-point2' },
          { label: 'Bullet Point 4', value: 'bullet-point4' },
          { label: 'Bullet Point 5', value: 'bullet-point5' },
          { label: 'Bullet Point 6', value: 'bullet-point6' },
          { label: 'Bullet Point 7', value: 'bullet-point7' },
          { label: 'Bullet Point 8', value: 'bullet-point8' },
          { label: 'Bullet Point 9', value: 'bullet-point9' },
          { label: 'Bullet Point 10', value: 'bullet-point10' },
          { label: 'Pitch Deck Original', value: 'pitchdeckorignal' },
          { label: 'Pitch Deck 2', value: 'pitch-deck-2' },
          { label: 'Pitch Deck 3', value: 'pitch-deck-3' },
          { label: 'Custom 2', value: 'custom2' },
          { label: 'Custom 3', value: 'custom3' },
          { label: 'Vertical Bullet Point 1', value: 'verticalBulletPoint1' },
          { label: 'Vertical Custom 1', value: 'verticalCustom1' },
        ],
      },
    }),
    model: Property.StaticDropdown({
      displayName: 'AI Model',
      required: false,
      defaultValue: 'gpt-4',
      options: {
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5', value: 'gpt-3.5' },
        ],
      },
    }),
    aiImages: Property.Checkbox({
      displayName: 'Use AI Images',
      required: false,
      defaultValue: false,
    }),
    imageForEachSlide: Property.Checkbox({
      displayName: 'Image for Each Slide',
      required: false,
      defaultValue: true,
    }),
    googleImage: Property.Checkbox({
      displayName: 'Use Google Images',
      required: false,
      defaultValue: false,
    }),
    googleText: Property.Checkbox({
      displayName: 'Use Google Text',
      required: false,
      defaultValue: false,
    }),
    language: Property.ShortText({
      displayName: 'Language Code',
      description:
        'Target language for the presentation (e.g., "en", "es", "fr"). Defaults to "en".',
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
    const { propsValue, auth } = context;

    const payload: Record<string, unknown> = {
      ...propsValue,
      accessId: auth as string,
    };

    const result = await makeRequest(
      HttpMethod.POST,
      '/ppt_from_summery',
      payload
    );

    return result;
  },
});
