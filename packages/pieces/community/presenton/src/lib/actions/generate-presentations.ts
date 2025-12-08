import { createAction, Property } from '@activepieces/pieces-framework';
import { presentonAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generatePresentations = createAction({
  auth: presentonAuth,
  name: 'generate_presentations',
  displayName: 'Generate Presentations (async)',
  description:
    'Create an asynchronous presentation generation task at Presenton and return the created task.',
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content for generating the presentation',
      required: false,
    }),

    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'Instruction for generating the presentation (optional).',
      required: false,
    }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      description: 'Tone to use for the text',
      required: false,
      defaultValue: 'default',
      options: {
        options: [
          { value: 'default', label: 'Default' },
          { value: 'casual', label: 'Casual' },
          { value: 'professional', label: 'Professional' },
          { value: 'funny', label: 'Funny' },
          { value: 'educational', label: 'Educational' },
          { value: 'sales_pitch', label: 'Sales pitch' },
        ],
      },
    }),
    verbosity: Property.StaticDropdown({
      displayName: 'Verbosity',
      description: 'How verbose the text should be',
      required: false,
      defaultValue: 'standard',
      options: {
        options: [
          { value: 'concise', label: 'Concise' },
          { value: 'standard', label: 'Standard' },
          { value: 'text-heavy', label: 'Text-heavy' },
        ],
      },
    }),
    slides_markdown: Property.Array({
      displayName: 'Slides markdown',
      description: 'An array of markdown strings for each slide (optional).',
      required: false,
      defaultValue: [],
    }),
    markdown_emphasis: Property.Checkbox({
      displayName: 'Markdown emphasis',
      description: 'Whether to emphasize the markdown',
      required: false,
      defaultValue: true,
    }),
    web_search: Property.Checkbox({
      displayName: 'Enable web search',
      description: 'Whether to enable web search',
      required: false,
      defaultValue: false,
    }),
    image_type: Property.StaticDropdown({
      displayName: 'Image type',
      description: 'Type of image to generate',
      required: false,
      defaultValue: 'stock',
      options: {
        options: [
          { value: 'stock', label: 'Stock' },
          { value: 'ai-generated', label: 'AI generated' },
        ],
      },
    }),
    theme: Property.ShortText({
      displayName: 'Theme',
      description:
        'Theme to use for the presentation (e.g. edge-yellow, light-rose)',
      required: false,
    }),
    n_slides: Property.Number({
      displayName: 'Number of slides',
      description: 'Number of slides to generate',
      required: false,
      defaultValue: 8,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language for the presentation',
      required: false,
      defaultValue: 'English',
    }),
    template: Property.StaticDropdown({
      displayName: 'Template',
      description: 'Template to use for the presentation',
      required: false,
      defaultValue: 'general',
      options: {
        options: [
          { value: 'general', label: 'General' },
          { value: 'modern', label: 'Modern' },
          { value: 'standard', label: 'Standard' },
          { value: 'swift', label: 'Swift' },
        ],
      },
    }),
    include_table_of_contents: Property.Checkbox({
      displayName: 'Include table of contents',
      description: 'Whether to include a table of contents',
      required: false,
      defaultValue: false,
    }),
    include_title_slide: Property.Checkbox({
      displayName: 'Include title slide',
      description: 'Whether to include a title slide',
      required: false,
      defaultValue: true,
    }),
    allow_access_to_user_info: Property.Checkbox({
      displayName: "Allow access to user's info",
      description: "Whether to allow access to user's info",
      required: false,
      defaultValue: true,
    }),
    files: Property.Array({
      displayName: 'Files',
      description:
        'Array of file identifiers uploaded via Presenton files API (optional).',
      required: false,
      defaultValue: [],
    }),
    export_as: Property.StaticDropdown({
      displayName: 'Export as',
      description: 'Export format',
      required: false,
      defaultValue: 'pptx',
      options: {
        options: [
          { value: 'pptx', label: 'PPTX' },
          { value: 'pdf', label: 'PDF' },
        ],
      },
    }),
    trigger_webhook: Property.Checkbox({
      displayName: 'Trigger webhook',
      description: 'Whether to trigger subscribed webhooks',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const {
      content,
      slides_markdown,
      instructions,
      tone,
      verbosity,
      markdown_emphasis,
      web_search,
      image_type,
      theme,
      n_slides,
      language,
      template,
      include_table_of_contents,
      include_title_slide,
      allow_access_to_user_info,
      files,
      export_as,
      trigger_webhook,
    } = propsValue;

    const body: any = {};

    if (content) body['content'] = content;
    if (slides_markdown)
      body['slides_markdown'] = slides_markdown as unknown as string[];
    if (instructions) body['instructions'] = instructions;
    if (tone) body['tone'] = tone;
    if (verbosity) body['verbosity'] = verbosity;
    body['markdown_emphasis'] = markdown_emphasis ?? true;
    body['web_search'] = web_search ?? false;
    if (image_type) body['image_type'] = image_type;
    if (theme) body['theme'] = theme;
    body['n_slides'] = Number(n_slides ?? 8);
    body['language'] = language ?? 'English';
    body['template'] = template ?? 'general';
    body['include_table_of_contents'] = include_table_of_contents ?? false;
    body['include_title_slide'] = include_title_slide ?? true;
    body['allow_access_to_user_info'] = allow_access_to_user_info ?? true;
    if (files) body['files'] = files as unknown as string[];
    body['export_as'] = export_as ?? 'pptx';
    body['trigger_webhook'] = trigger_webhook ?? false;

    try {
      const response = await makeRequest(
        apiKey,
        HttpMethod.POST,
        '/ppt/presentation/generate/async',
        body
      );
     
      const pollIntervalSeconds = 5;

      const taskId = response.id;
      if (!taskId) {
        throw new Error(
          `Presenton did not return a task id: ${JSON.stringify(response)}`
        );
      }

      const start = Date.now();
      const timeoutMs = 120 * 1000;

      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

      while (Date.now() - start < timeoutMs) {
        const statusResp = await makeRequest(
          apiKey,
          HttpMethod.GET,
          `/ppt/presentation/status/${taskId}`
        );

        if (statusResp.status === 'completed') {
          return statusResp;
        }

        if (statusResp.status === 'failed') {
          throw new Error(
            `Presentation generation failed: ${JSON.stringify(statusResp)}`
          );
        }

        await sleep(pollIntervalSeconds * 1000);
      }

      throw new Error(
        `Timed out waiting for presentation generation after 120 seconds`
      );
    } catch (err) {
      throw new Error(`Presenton API error: ${err}`);
    }
  },
});
