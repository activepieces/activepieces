import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../../auth';
import { streakApiCall } from '../common/client';
import { pipelineDropdown } from '../common/props';
import { StreakSearchResponse } from '../common/types';

export const findBoxAction = createAction({
  auth: streakAuth,
  name: 'find_box',
  displayName: 'Find Boxes',
  description:
    'Search boxes by name or query. Returns matching boxes across all pipelines, optionally filtered to one pipeline.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'The text to search for. Matches against box name, notes, emails, and text custom fields.',
      required: true,
    }),
    pipelineKey: { ...pipelineDropdown, required: false },
  },
  async run(context) {
    const { query, pipelineKey } = context.propsValue;

    const queryParams: Record<string, string> = { query };
    if (pipelineKey) {
      queryParams['pipelineKey'] = pipelineKey;
    }

    const response = await streakApiCall<StreakSearchResponse>({
      apiKey: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/api/v1/search',
      queryParams,
    });

    const boxes = response.body.results?.boxes ?? [];
    return boxes.map((b) => ({
      box_key: b.boxKey,
      name: b.name,
      pipeline_key: b.pipelineKey ?? null,
      stage_key: b.stageKey ?? null,
      last_updated_timestamp_epoch_ms: b.lastUpdatedTimestamp ?? null,
    }));
  },
});
