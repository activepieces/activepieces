import { OutputSchema } from '@activepieces/pieces-framework';

export const aiScraperTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'poll_attempts', label: 'Queries Used', format: 'number', description: 'Result queries dispatched by this invocation. Creation is not counted.' },
    { key: 'elapsed_seconds', label: 'Elapsed Seconds', format: 'number', description: 'Time spent in this invocation, including creation, queries, and waiting when enabled.' },
    {
      key: 'task_id',
      label: 'Task ID',
      description: 'Reuse this ID in AI Scraper with Operation set to Get Task Result.',
    },
    {
      key: 'status',
      label: 'Task Status',
      description: 'The provider task status: pending, running, or success.',
    },
    {
      key: 'completed',
      label: 'Task Completed',
      format: 'boolean',
      description: 'Whether the provider task succeeded. Also check Has Answer.',
    },
    {
      key: 'result_text',
      label: 'Answer Text',
      description: 'Normalized answer text, or null while no answer is available.',
    },
    {
      key: 'answer_field',
      label: 'Native Answer Field',
      description: 'The native field used for Answer Text, or null.',
    },
    {
      key: 'has_answer',
      label: 'Has Answer',
      format: 'boolean',
      description: 'Whether Answer Text contains non-empty text.',
    },
    { key: 'citations', label: 'Native Citations', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'web_results', label: 'Native Web Results', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'web_search_results', label: 'Native Web Search Results', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'x_search_results', label: 'Native X Search Results', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'source', label: 'Native Source', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'web_source', label: 'Native Web Source', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'references', label: 'Native References', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'sources', label: 'Native Sources', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'share_url', label: 'Share URL', format: 'url' },
    { key: 'links', label: 'Native Links', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'search_result', label: 'Native Search Result', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    { key: 'content_references', label: 'Native Content References', description: 'JSON text in Table-Friendly Fields; the original array in Original Structured Fields.' },
    {
      key: 'task_result',
      label: 'Complete Native Result',
      description:
        'The complete engine-specific payload as JSON text in Table-Friendly Fields, as its original structure in Original Structured Fields, or null before it is available.',
    },
  ],
};
