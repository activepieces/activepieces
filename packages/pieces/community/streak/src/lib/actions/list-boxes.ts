import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { flattenStreakBox } from '../common/flatten';
import { boxListOutputSchema } from '../common/output-schemas';
import { StreakBox } from '../common/types';

export const listBoxesAction = createAction({
  auth: streakAuth,
  name: 'list_boxes',
  classification: 'SEARCH',
  displayName: 'List Boxes',
  description: 'List boxes in a pipeline, most recently updated first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List boxes (CRM records) in one Streak pipeline, most recently updated first, with stage, notes, counts and custom field values. Use to browse a pipeline or collect box_keys when there is no search text; use Find Boxes to search by text. Requires a pipeline_key from List Pipelines; page through results with limit and page. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: boxListOutputSchema,
  props: {
    pipeline_key: Property.ShortText({
      displayName: 'Pipeline Key',
      description: 'The pipeline key (from List Pipelines).',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of boxes to return (1-200). Defaults to 50.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Zero-based page number. Defaults to 0.',
      required: false,
    }),
  },
  async run(context) {
    const { pipeline_key, limit, page } = context.propsValue;
    const effectiveLimit = Math.min(
      Math.max(Math.floor(limit ?? DEFAULT_LIMIT), 1),
      MAX_LIMIT,
    );
    const effectivePage = Math.max(Math.floor(page ?? 0), 0);
    const response = await streakApiCall<StreakBox[]>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v1/pipelines/${encodeURIComponent(pipeline_key.trim())}/boxes`,
      queryParams: {
        sortBy: 'lastUpdatedTimestamp',
        limit: String(effectiveLimit),
        page: String(effectivePage),
      },
    });
    return (response.body ?? []).map(flattenStreakBox);
  },
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
