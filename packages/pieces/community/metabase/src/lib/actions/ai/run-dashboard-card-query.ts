import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseRunDashboardCardQueryOutputSchema } from '../../output-schemas';

export const runDashboardCardQueryAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_run_dashboard_card_query',
  outputSchema: metabaseRunDashboardCardQueryOutputSchema,
  displayName: 'Run Dashboard Card Query',
  description: "Run one card on a dashboard with the dashboard's filters.",
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Runs one card as it appears on a dashboard and returns its rows, applying dashboard filter values by slug (from the `parameters` of Get Dashboard); an unknown slug fails the call. Get the dashcard id and card id from Get Dashboard. Read-only.',
    idempotent: true,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
    dashcardId: Property.Number({
      displayName: 'Dashcard ID',
      description:
        "The `id` of the card's entry in `dashcards` from Get Dashboard (not the card id).",
      required: true,
    }),
    cardId: metabaseAiProps.cardId({
      required: true,
      description: 'The `card_id` of the same dashcard, from Get Dashboard.',
    }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description:
        'Dashboard filter values keyed by parameter slug, e.g. {"category": "Gizmo"}. Empty = no filters.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const values = propsValue.parameters ?? {};
    const slugs = Object.keys(values);
    const dashboardParameters =
      slugs.length > 0
        ? (
            await metabaseApi.getDashboard({
              auth,
              dashboardId: propsValue.dashboardId,
            })
          ).parameters ?? []
        : [];
    const unknownSlugs = slugs.filter(
      (slug) => !dashboardParameters.some((param) => param.slug === slug)
    );
    if (unknownSlugs.length > 0) {
      throw new Error(
        `Unknown parameter slug(s): ${unknownSlugs.join(
          ', '
        )}. This dashboard accepts: ${
          dashboardParameters.map((param) => param.slug).join(', ') ||
          'no parameters'
        }.`
      );
    }
    return await metabaseApi.runDashboardCardQuery({
      auth,
      dashboardId: propsValue.dashboardId,
      dashcardId: propsValue.dashcardId,
      cardId: propsValue.cardId,
      parameters: dashboardParameters
        .filter((param) => slugs.includes(param.slug))
        .map((param) => ({
          id: param.id,
          type: param.type,
          value: values[param.slug],
        })),
    });
  },
});
