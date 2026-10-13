import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const usageFields: OutputSchemaField[] = [
  { key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
  { key: 'completion_tokens', label: 'Completion Tokens', format: 'number' },
  { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
  { key: 'num_sources_used', label: 'Sources Used', format: 'number' },
];

const toolCallFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tool Call ID' },
  { key: 'type', label: 'Type' },
  {
    key: 'function',
    label: 'Function',
    children: [
      { key: 'name', label: 'Name' },
      { key: 'arguments', label: 'Arguments (JSON)' },
    ],
  },
];

export const askGrokActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'content', label: 'Content' },
    { key: 'reasoning_content', label: 'Reasoning Content' },
    { key: 'refusal', label: 'Refusal' },
    { key: 'role', label: 'Role' },
    { key: 'finish_reason', label: 'Finish Reason' },
    { key: 'model', label: 'Model' },
    { key: 'id', label: 'Response ID' },
    { key: 'created', label: 'Created (Unix Seconds)' },
    { key: 'tool_calls', label: 'Tool Calls', labelKey: 'function.name', listItems: toolCallFields },
    { key: 'citations', label: 'Citations' },
    { key: 'usage', label: 'Usage', children: usageFields },
  ],
};

export const categorizeTextActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'categories', label: 'Categories' },
    { key: 'primary_category', label: 'Primary Category' },
    { key: 'total_categories_assigned', label: 'Total Categories Assigned', format: 'number' },
    { key: 'multiple_categories', label: 'Multiple Categories Allowed', format: 'boolean' },
    { key: 'reasoning', label: 'Reasoning' },
    { key: 'reasoning_content', label: 'Reasoning Content' },
    { key: 'confidence_scores', label: 'Confidence Scores', dynamicKey: true },
    { key: 'avg_confidence', label: 'Average Confidence', format: 'number' },
    { key: 'max_confidence', label: 'Max Confidence', format: 'number' },
    { key: 'min_confidence', label: 'Min Confidence', format: 'number' },
    { key: 'model', label: 'Model' },
    { key: 'finish_reason', label: 'Finish Reason' },
    { key: 'citations', label: 'Citations' },
    { key: 'usage', label: 'Usage', children: usageFields },
  ],
};

export const extractDataFromTextActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'extracted_data', label: 'Extracted Data', dynamicKey: true },
    { key: 'extraction_success', label: 'Extraction Success', format: 'boolean' },
    { key: 'extraction_notes', label: 'Extraction Notes' },
    { key: 'fields_extracted', label: 'Fields Extracted', format: 'number' },
    { key: 'fields_requested', label: 'Fields Requested', format: 'number' },
    { key: 'completion_rate', label: 'Completion Rate', format: 'number' },
    { key: 'required_fields_found', label: 'Required Fields Found', format: 'number' },
    { key: 'required_fields_missing', label: 'Required Fields Missing', format: 'number' },
    { key: 'confidence_scores', label: 'Confidence Scores', dynamicKey: true },
    { key: 'avg_confidence', label: 'Average Confidence', format: 'number' },
    { key: 'max_confidence', label: 'Max Confidence', format: 'number' },
    { key: 'min_confidence', label: 'Min Confidence', format: 'number' },
    { key: 'reasoning_content', label: 'Reasoning Content' },
    { key: 'model', label: 'Model' },
    { key: 'finish_reason', label: 'Finish Reason' },
    { key: 'citations', label: 'Citations' },
    { key: 'usage', label: 'Usage', children: usageFields },
  ],
};

export const generateImageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'images',
      label: 'Images',
      labelKey: 'revised_prompt',
      listItems: [
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'b64_json', label: 'Base64 JSON' },
        { key: 'revised_prompt', label: 'Revised Prompt' },
      ],
    },
    { key: 'total_images', label: 'Total Images', format: 'number' },
    { key: 'prompt_used', label: 'Prompt Used' },
    { key: 'model_used', label: 'Model Used' },
    { key: 'response_format', label: 'Response Format' },
  ],
};
