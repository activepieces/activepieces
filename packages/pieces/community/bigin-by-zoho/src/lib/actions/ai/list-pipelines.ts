import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginApiService, getBiginConnection, isObject } from '../../common/request';
import { biginOutputSchemas } from '../../common/output-schemas';

function toObjects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function picklist({ layout, apiName }: { layout: Record<string, unknown>; apiName: string }): string[] {
  for (const section of toObjects(layout['sections'])) {
    for (const field of toObjects(section['fields'])) {
      if (field['api_name'] === apiName) {
        return toObjects(field['pick_list_values'])
          .map((v) => v['actual_value'])
          .filter((v): v is string => typeof v === 'string' && v !== '-None-');
      }
    }
  }
  return [];
}

export const biginListPipelinesAi = createAction({
  auth: biginAuth,
  name: 'bigin_list_pipelines',
  classification: 'READ',
  displayName: 'List Pipelines (Agent)',
  description: 'List pipelines with their sub-pipelines and stages.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiListPipelines,
  aiMetadata: {
    description:
      'Lists the Bigin pipelines (layouts of the Pipelines module) with their id, name, sub-pipeline names and stage names. Use before creating or moving a deal to get valid Pipeline ID, Sub-Pipeline and Stage values. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { accessToken, apiDomain } = getBiginConnection(context.auth);
    const response = await biginApiService.fetchLayouts(accessToken, apiDomain, 'Pipelines');
    const layouts = toObjects(isObject(response) ? response['layouts'] : undefined);
    return {
      pipelines: layouts.map((layout) => ({
        layout_id: layout['id'],
        name: layout['name'],
        sub_pipelines: picklist({ layout, apiName: 'Sub_Pipeline' }),
        stages: picklist({ layout, apiName: 'Stage' }),
      })),
    };
  },
});
