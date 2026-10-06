import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationGeneratePresentationOutputSchema } from '../../output-schemas';

const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_MS = 55000;

const FAILED_STATUSES = ['failed', 'error'];

type TaskStatus = { id: string; status: string } & Record<string, unknown>;

function sleep({ ms }: { ms: number }) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const generatePresentation = createAction({
  auth: presentonAuth,
  name: 'presentation_generate_presentation',
  outputSchema: presentationGeneratePresentationOutputSchema,
  displayName: 'Generate Presentation',
  description: 'Generate an AI presentation from a prompt and wait for the result.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a Presenton generation task (v3) from a content prompt, then waits up to 55 seconds for it to finish. If the task is still running when the wait ends, returns its id and status instead of failing: pass that id to presentation_get_task_status to keep polling. Use presentation_upload_source_files to get ids for files, and presentation_list_standard_templates for standard_template ids. Each call starts a new paid task.',
    idempotent: false,
  },
  props: {
    content: Property.LongText({ displayName: 'Content', description: 'Topic or text the presentation is generated from.', required: true }),
    instructions: Property.LongText({ displayName: 'Instructions', required: false }),
    n_slides: Property.Number({ displayName: 'Number of Slides', required: false }),
    language: Property.ShortText({ displayName: 'Language', required: false }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      required: false,
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
      required: false,
      options: {
        options: [
          { value: 'concise', label: 'Concise' },
          { value: 'standard', label: 'Standard' },
          { value: 'text-heavy', label: 'Text-heavy' },
        ],
      },
    }),
    standard_template: Property.ShortText({ displayName: 'Standard Template ID', description: 'From presentation_list_standard_templates.', required: false }),
    smart_design: Property.ShortText({ displayName: 'Smart Design ID', description: 'From presentation_list_smart_designs.', required: false }),
    image_type: Property.StaticDropdown({
      displayName: 'Image Type',
      required: false,
      options: {
        options: [
          { value: 'stock', label: 'Stock' },
          { value: 'ai-generated', label: 'AI generated' },
        ],
      },
    }),
    web_search: Property.Checkbox({ displayName: 'Enable Web Search', required: false, defaultValue: false }),
    include_title_slide: Property.Checkbox({ displayName: 'Include Title Slide', required: false, defaultValue: true }),
    include_table_of_contents: Property.Checkbox({ displayName: 'Include Table of Contents', required: false, defaultValue: false }),
    files: Property.Array({ displayName: 'File IDs', description: 'Ids returned by presentation_upload_source_files.', required: false }),
    reference_urls: Property.Array({ displayName: 'Reference URLs', required: false }),
    export_as: Property.StaticDropdown({
      displayName: 'Export As',
      required: false,
      defaultValue: 'pptx',
      options: {
        options: [
          { value: 'pptx', label: 'PPTX' },
          { value: 'pdf', label: 'PDF' },
          { value: 'png', label: 'PNG' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const started = await presentonClient.request<TaskStatus>({
      auth: apiKey,
      method: HttpMethod.POST,
      path: '/api/v3/presentation/generate/async',
      body: presentonClient.dropUndefined({
        ...propsValue,
        files: presentonClient.toStringArray(propsValue.files),
        reference_urls: presentonClient.toStringArray(propsValue.reference_urls),
      }),
    });

    const deadline = Date.now() + MAX_WAIT_MS;
    let task = started;
    while (task.status !== 'completed' && !FAILED_STATUSES.includes(task.status) && Date.now() < deadline) {
      await sleep({ ms: POLL_INTERVAL_MS });
      task = await presentonClient.request<TaskStatus>({
        auth: apiKey,
        method: HttpMethod.GET,
        path: `/api/v3/async-task/status/${started.id}`,
      });
    }

    if (FAILED_STATUSES.includes(task.status)) {
      throw new Error(`Presentation generation failed: ${JSON.stringify(task)}`);
    }
    if (task.status !== 'completed') {
      return { id: started.id, status: task.status };
    }
    return task;
  },
});
