import { createAction, Property } from '@activepieces/pieces-framework';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

export const generateVariantsAction = createAction({
  auth: stitchGoogleAuth,
  name: 'generate_variants',
  displayName: 'Generate Screen Variants',
  description: 'Generate multiple design variants of an existing screen. Great for exploring design options.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project that contains the screen.',
      required: true,
    }),
    screen_id: Property.ShortText({
      displayName: 'Screen ID',
      description: 'The ID of the screen to create variants of.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Variant Instructions',
      description: 'Describe how you want the variants to differ (e.g. "Try different color schemes and typography options").',
      required: true,
    }),
    variant_count: Property.Number({
      displayName: 'Number of Variants',
      description: 'How many variants to generate (1–5).',
      required: false,
      defaultValue: 3,
    }),
    creative_range: Property.StaticDropdown({
      displayName: 'Creative Range',
      description: '"Refine" makes subtle changes. "Explore" tries different approaches. "Reimagine" creates bold new interpretations.',
      required: false,
      defaultValue: 'EXPLORE',
      options: {
        options: [
          { label: 'Refine (subtle changes)', value: 'REFINE' },
          { label: 'Explore (different approaches)', value: 'EXPLORE' },
          { label: 'Reimagine (bold reinterpretation)', value: 'REIMAGINE' },
        ],
      },
    }),
    aspects: Property.StaticMultiSelectDropdown({
      displayName: 'Design Aspects to Vary',
      description: 'Choose which design aspects the variants should differ in. Leave empty to vary all aspects.',
      required: false,
      options: {
        options: [
          { label: 'Layout', value: 'LAYOUT' },
          { label: 'Color Scheme', value: 'COLOR_SCHEME' },
          { label: 'Images', value: 'IMAGES' },
          { label: 'Text / Font', value: 'TEXT_FONT' },
          { label: 'Text Content', value: 'TEXT_CONTENT' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = extractApiKey(context.auth);
    const { project_id, screen_id, prompt, variant_count, creative_range, aspects } =
      context.propsValue;

    const variantOptions: Record<string, unknown> = {
      variantCount: variant_count ?? 3,
      creativeRange: creative_range ?? 'EXPLORE',
    };

    if (aspects && aspects.length > 0) {
      variantOptions['aspects'] = aspects;
    }

    const result = await stitchClient.callStitchTool<StitchVariantsResult>(
      apiKey,
      'generate_variants',
      {
        projectId: project_id,
        screenId: screen_id,
        prompt,
        variantOptions,
      }
    );

    if (!result?.screens) return [];
    return result.screens.map((s) => ({
      screen_id: s.screenId ?? s.id,
      project_id: s.projectId ?? project_id,
      display_name: s.displayName,
      device_type: s.deviceType,
      html_url: s.htmlUrl,
      image_url: s.imageUrl,
      created_time: s.createTime,
    }));
  },
});

type StitchScreen = {
  id: string;
  screenId: string;
  projectId: string;
  displayName: string;
  deviceType: string;
  htmlUrl: string;
  imageUrl: string;
  createTime: string;
};

type StitchVariantsResult = {
  screens: StitchScreen[];
};
