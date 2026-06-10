import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { FINDALL_GENERATORS, parallelClient } from '../common/client';

export const createFindAllRunAction = createAction({
  auth: parallelAuth,
  name: 'create_findall_run',
  displayName: 'Create FindAll Run',
  description:
    'Discover and verify entities matching plain-language criteria. Match conditions can be supplied directly or auto-generated from the objective.',
  props: {
    objective: Property.LongText({
      displayName: 'Objective',
      description:
        'Natural-language description of the target entities. e.g. "AI companies that raised Series A funding in 2024".',
      required: true,
    }),
    entity_type: Property.ShortText({
      displayName: 'Entity Type',
      description: 'Type of entities to find (e.g. "company", "people").',
      required: true,
    }),
    match_conditions: Property.Json({
      displayName: 'Match Conditions',
      description:
        'Array of `{ "name": "...", "description": "..." }` objects describing the criteria each match must satisfy. Leave empty to auto-generate from the objective.',
      required: false,
      defaultValue: [],
    }),
    generator: Property.StaticDropdown({
      displayName: 'Generator',
      description: 'Generator tier — higher tiers use deeper search at higher cost.',
      required: true,
      defaultValue: 'core',
      options: { options: FINDALL_GENERATORS },
    }),
    match_limit: Property.Number({
      displayName: 'Match Limit',
      description: 'Maximum number of matches to find (5–1000). Defaults to 100.',
      required: true,
      defaultValue: 100,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Optional key/value metadata stored with the run.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const apiKey = context.auth.secret_text;

    const providedConditions = normalizeMatchConditions(props.match_conditions);

    let entityType = props.entity_type;
    let generator = props.generator;
    let matchConditions = providedConditions;

    if (matchConditions.length === 0) {
      const ingested = await parallelClient.request<{
        entity_type?: string;
        match_conditions?: Array<{ name: string; description: string }>;
        generator?: string;
      }>({
        apiKey,
        method: HttpMethod.POST,
        path: '/v1beta/findall/ingest',
        body: { objective: props.objective },
      });

      if (!ingested.match_conditions || ingested.match_conditions.length === 0) {
        throw new Error(
          'Could not auto-generate match conditions from the objective. Please provide them explicitly.',
        );
      }
      matchConditions = ingested.match_conditions;
      if (!entityType && ingested.entity_type) entityType = ingested.entity_type;
      if (ingested.generator) generator = ingested.generator;
    }

    const body: Record<string, unknown> = {
      objective: props.objective,
      entity_type: entityType,
      match_conditions: matchConditions,
      generator,
      match_limit: props.match_limit,
    };
    if (props.metadata && Object.keys(props.metadata).length > 0) {
      body['metadata'] = props.metadata;
    }

    return await parallelClient.request({
      apiKey,
      method: HttpMethod.POST,
      path: '/v1beta/findall/runs',
      body,
    });
  },
});

function normalizeMatchConditions(
  raw: unknown,
): Array<{ name: string; description: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ name: string; description: string }> = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      'name' in item &&
      'description' in item &&
      typeof (item as Record<string, unknown>)['name'] === 'string' &&
      typeof (item as Record<string, unknown>)['description'] === 'string'
    ) {
      out.push({
        name: (item as Record<string, string>)['name'],
        description: (item as Record<string, string>)['description'],
      });
    }
  }
  return out;
}
