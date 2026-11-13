import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { pipelineFieldListOutputSchema } from '../common/output-schemas';
import { StreakField } from '../common/types';

export const listPipelineFieldsAction = createAction({
  auth: streakAuth,
  name: 'list_pipeline_fields',
  classification: 'SEARCH',
  displayName: 'List Pipeline Fields',
  description: 'List the custom fields defined on a pipeline.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the custom fields defined on one Streak pipeline, returning each field_key, name, type (TEXT_INPUT, NUMBER, DATE, DROPDOWN, CHECKBOX, ...) and, for DROPDOWN fields, the option keys and names. Use to find the field_key and valid values before calling Update Box with field_updates; requires a pipeline_key from List Pipelines. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: pipelineFieldListOutputSchema,
  props: {
    pipeline_key: Property.ShortText({
      displayName: 'Pipeline Key',
      description: 'The pipeline key (from List Pipelines).',
      required: true,
    }),
  },
  async run(context) {
    const response = await streakApiCall<StreakField[]>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v1/pipelines/${encodeURIComponent(context.propsValue.pipeline_key.trim())}/fields`,
    });
    return (response.body ?? []).map((f) => ({
      field_key: f.key,
      name: f.name,
      type: f.type ?? null,
      dropdown_options: (f.dropdownSettings?.items ?? []).map((item) => ({
        key: item.key,
        name: item.name,
      })),
    }));
  },
});
