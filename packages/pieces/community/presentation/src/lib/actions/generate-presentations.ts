import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { presentonAuth } from '../common/auth';
import { presentonClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generatePresentations = createAction({
  auth: presentonAuth,
  name: 'generate_presentations',
  classification: 'WRITE',
  displayName: 'Generate Presentation',
  description:
    'Generates a deck from your content and returns it when it is ready.',
  audience: 'human',
  aiMetadata: {
    description:
      'Generate an AI-powered slide presentation in Presenton from a content prompt (or per-slide markdown), then poll until generation completes (up to 120 seconds) and return the finished presentation. Use when an agent needs to produce a deck from a topic or outline, optionally controlling tone, slide count, theme/template, image style (stock vs. AI-generated), web search, and export format (PPTX or PDF). Each call starts a new generation task, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description: 'Topic or source text the slides are written from.',
      required: false,
      placeholder: 'Quarterly sales review for the leadership team',
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'Extra guidance for the writer, such as audience or focus.',
      required: false,
      placeholder: 'Keep it to one idea per slide',
    }),
    slides_markdown: Property.Array({
      displayName: 'Slide Markdown',
      description: 'Markdown for each slide, one item per slide.',
      required: false,
      defaultValue: [],
    }),
    files: Property.Array({
      displayName: 'File IDs',
      description: 'IDs of files uploaded to Presenton to build the deck from.',
      required: false,
      defaultValue: [],
    }),
    web_search: Property.Checkbox({
      displayName: 'Enable Web Search',
      description: 'Search the web for extra material while writing.',
      required: false,
      defaultValue: false,
    }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      description: 'Writing style of the slide text.',
      required: false,
      defaultValue: 'default',
      width: 'half',
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
      description: 'How much text goes on each slide.',
      required: false,
      defaultValue: 'standard',
      width: 'half',
      options: {
        options: [
          { value: 'concise', label: 'Concise' },
          { value: 'standard', label: 'Standard' },
          { value: 'text-heavy', label: 'Text-heavy' },
        ],
      },
    }),
    template: Property.StaticDropdown({
      displayName: 'Template',
      description: 'Layout style for the slides.',
      required: false,
      defaultValue: 'general',
      width: 'half',
      options: {
        options: [
          { value: 'general', label: 'General' },
          { value: 'modern', label: 'Modern' },
          { value: 'standard', label: 'Standard' },
          { value: 'swift', label: 'Swift' },
        ],
      },
    }),
    image_type: Property.StaticDropdown({
      displayName: 'Image Type',
      description: 'Use stock photos or generate images with AI.',
      required: false,
      defaultValue: 'stock',
      width: 'half',
      options: {
        options: [
          { value: 'stock', label: 'Stock' },
          { value: 'ai-generated', label: 'AI generated' },
        ],
      },
    }),
    theme: Property.ShortText({
      displayName: 'Theme',
      description: 'Presenton theme name. Leave empty for the default theme.',
      required: false,
      placeholder: 'edge-yellow',
    }),
    deck_info: Property.MarkDown({
      value: 'The step waits up to 2 minutes for the deck to finish.',
      variant: MarkdownVariant.INFO,
    }),
    n_slides: Property.Number({
      displayName: 'Number of Slides',
      description: 'How many slides to generate.',
      required: false,
      defaultValue: 8,
      width: 'half',
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language the slides are written in.',
      required: false,
      defaultValue: 'English',
      placeholder: 'English',
      width: 'half',
    }),
    export_as: Property.StaticDropdown({
      displayName: 'Export As',
      description: 'File format of the finished deck.',
      required: false,
      defaultValue: 'pptx',
      options: {
        options: [
          { value: 'pptx', label: 'PPTX' },
          { value: 'pdf', label: 'PDF' },
        ],
      },
    }),
    include_title_slide: Property.Checkbox({
      displayName: 'Include Title Slide',
      description: 'Start the deck with a title slide.',
      required: false,
      defaultValue: true,
    }),
    include_table_of_contents: Property.Checkbox({
      displayName: 'Include Table of Contents',
      description: "Add a slide listing the deck's sections.",
      required: false,
      defaultValue: false,
    }),
    markdown_emphasis: Property.Checkbox({
      displayName: 'Markdown Emphasis',
      description: 'Show Markdown emphasis, such as bold text, on the slides.',
      required: false,
      defaultValue: true,
      advanced: true,
    }),
    allow_access_to_user_info: Property.Checkbox({
      displayName: 'Allow Access to User Info',
      description: "Let Presenton use your account's user info while generating.",
      required: false,
      defaultValue: true,
      advanced: true,
    }),
    trigger_webhook: Property.Checkbox({
      displayName: 'Trigger Webhooks',
      description: 'Notify the webhooks subscribed in your Presenton account.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'text',
      props: ['content', 'instructions', 'slides_markdown', 'files', 'web_search'],
    },
    {
      key: 'style',
      display: 'section',
      label: 'Style',
      icon: 'sliders',
      props: ['tone', 'verbosity', 'template', 'image_type', 'theme'],
    },
    {
      key: 'deck',
      display: 'section',
      label: 'Deck',
      icon: 'file',
      props: [
        'deck_info',
        'n_slides',
        'language',
        'export_as',
        'include_title_slide',
        'include_table_of_contents',
      ],
    },
  ],
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

    const slidesMarkdown = presentonClient.toStringArray(slides_markdown);
    const fileIds = presentonClient.toStringArray(files);

    const body: Record<string, unknown> = {
      ...(content ? { content } : {}),
      ...(slidesMarkdown ? { slides_markdown: slidesMarkdown } : {}),
      ...(instructions ? { instructions } : {}),
      ...(tone ? { tone } : {}),
      ...(verbosity ? { verbosity } : {}),
      markdown_emphasis: markdown_emphasis ?? true,
      web_search: web_search ?? false,
      ...(image_type ? { image_type } : {}),
      ...(theme ? { theme } : {}),
      n_slides: Number(n_slides ?? 8),
      language: language ?? 'English',
      template: template ?? 'general',
      include_table_of_contents: include_table_of_contents ?? false,
      include_title_slide: include_title_slide ?? true,
      allow_access_to_user_info: allow_access_to_user_info ?? true,
      ...(fileIds ? { files: fileIds } : {}),
      export_as: export_as ?? 'pptx',
      trigger_webhook: trigger_webhook ?? false,
    };

    const response = await presentonClient.request<{
      id?: string;
      status?: string;
    }>({
      auth: apiKey,
      method: HttpMethod.POST,
      path: '/api/v1/ppt/presentation/generate/async',
      body,
    });

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
      const statusResp = await presentonClient.request<{
        id?: string;
        status?: string;
      }>({
        auth: apiKey,
        method: HttpMethod.GET,
        path: `/api/v1/ppt/presentation/status/${taskId}`,
      });

      if (statusResp.status === 'completed') {
        return statusResp;
      }

      if (statusResp.status === 'failed' || statusResp.status === 'error') {
        throw new Error(
          `Presentation generation failed: ${JSON.stringify(statusResp)}`
        );
      }

      await sleep(pollIntervalSeconds * 1000);
    }

    throw new Error(
      `Timed out waiting for presentation generation after 120 seconds`
    );
  },
});
