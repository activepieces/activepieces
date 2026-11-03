import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { props } from '../../generated/lemur-task/props';

export const lemurTask = createAction({
  name: 'lemurTask',
  classification: 'READ',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Run a Task Using LeMUR',
  description: 'Ask an AI model about your transcripts or text.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a custom LLM prompt over one or more existing transcripts using AssemblyAI LeMUR, returning the model-generated response. Use this to summarize, answer questions about, or otherwise reason over transcript content with your own prompt. Requires transcript IDs and a prompt; each call invokes the LLM and produces a new request, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    ...props,
    input_info: Property.MarkDown({
      value: 'Give either transcript IDs or input text, not both.',
      variant: MarkdownVariant.INFO,
    }),
  },
  propertyGroups: [
    {
      key: 'prompt',
      display: 'section',
      label: 'Prompt',
      icon: 'text',
      props: ['prompt', 'context'],
    },
    {
      key: 'input',
      display: 'section',
      label: 'Input',
      icon: 'file',
      props: ['input_info', 'transcript_ids', 'input_text'],
    },
    {
      key: 'model',
      display: 'section',
      label: 'Model',
      icon: 'sliders',
      props: ['final_model', 'max_output_size', 'temperature'],
    },
  ],
  async run(context) {
    const client = getAssemblyAIClient(context);
    const {
      input_text,
      context: lemurContext,
      final_model,
      max_output_size,
      temperature,
    } = context.propsValue;
    const taskResponse = await client.lemur.task({
      transcript_ids: context.propsValue.transcript_ids as string[],
      prompt: context.propsValue.prompt,
      ...(input_text ? { input_text } : {}),
      ...(lemurContext ? { context: lemurContext } : {}),
      ...(final_model ? { final_model } : {}),
      ...(max_output_size ? { max_output_size } : {}),
      ...(temperature !== undefined && temperature !== null
        ? { temperature }
        : {}),
    });
    return taskResponse;
  },
});
