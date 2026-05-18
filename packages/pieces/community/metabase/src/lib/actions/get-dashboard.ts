import { createAction, Property } from '@activepieces/pieces-framework';
import { queryMetabaseApi } from '../common';
import { metabaseAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';

interface MetabaseParam {
  id: string;
  name?: string;
  slug?: string;
  type?: string;
  values_source_config?: {
    values?: unknown[];
  };
}
interface CardResult {
  name: string;
  data?: unknown;
  error?: string;
}
interface DashboardParameter {
  id: string;
  name: string;
  slug: string;
  type: string;
  possible_values?: unknown[];
}

interface DashboardResult {
  dashboard_name: string;
  available_parameters: DashboardParameter[];
  cards_results: Record<string, CardResult>;
}

export const getDashboardQuestions = createAction({
  name: 'getDashboardQuestions',
  auth: metabaseAuth,
  requireAuth: true,
  displayName: 'Get Dashboard Questions',
  description:
    'Execute all questions across all tabs in a Metabase dashboard and return their consolidated results in a single response',
  props: {
    dashboardId: Property.ShortText({
      displayName: 'Metabase Dashboard ID',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Parameters (slug name -> value)',
      description: 'Dashboard parameters to apply to all questions',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const dashboardId = propsValue.dashboardId.split('-')[0];

    const dashboardData = await queryMetabaseApi(
      { endpoint: `dashboard/${dashboardId}`, method: HttpMethod.GET },
      auth
    );

    if (dashboardData.error) {
      throw new Error(`Error fetching dashboard: ${dashboardData.error}`);
    }

    const dashboardParameters = dashboardData.parameters || [];

    const result: DashboardResult = {
      dashboard_name: dashboardData.name || 'Unknown Dashboard',
      available_parameters: dashboardParameters.map((param: MetabaseParam) => ({
        id: param.id,
        name: param.name || 'Unknown',
        slug: param.slug || '',
        type: param.type || '',
        possible_values: param.values_source_config?.values || [],
      })),
      cards_results: {},
    };

    // Execute each card and collect results
    for (const dashcard of dashboardData.dashcards || []) {
      const cardId = dashcard.card_id;
      const dashcardId = dashcard.id;

      if (!cardId) continue;

      let cardName = 'Unknown';
      if (dashcard.card && typeof dashcard.card === 'object') {
        cardName = dashcard.card.name || `Card ${cardId}`;
      }

      const cardParameters = [];

      // Map dashboard parameters to card parameters using parameter_mappings
      if (propsValue.parameters && dashcard.parameter_mappings) {
        for (const mapping of dashcard.parameter_mappings) {
          const paramId = mapping.parameter_id;

          // Find corresponding dashboard parameter
          const dashParam = dashboardParameters.find(
            (p: { id: string }) => p.id === paramId
          );

          if (
            dashParam &&
            dashParam.slug &&
            propsValue.parameters[dashParam.slug] !== undefined
          ) {
            cardParameters.push({
              id: paramId,
              target: mapping.target,
              type: dashParam.type,
              value: propsValue.parameters[dashParam.slug],
            });
          }
        }
      }

      try {
        const cardResult = await queryMetabaseApi(
          {
            endpoint: `dashboard/${dashboardId}/dashcard/${dashcardId}/card/${cardId}/query/json`,
            method: HttpMethod.POST,
            body: {
              parameters: cardParameters,
            },
          },
          auth
        );

        const cardIdStr = String(cardId);
        result.cards_results[cardIdStr] = {
          name: cardName,
          data: cardResult,
        };
      } catch (error: unknown) {
        let errorMessage = 'Unknown error';

        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string'
        ) {
          errorMessage = error.message;
        }

        const cardIdStr = String(cardId);
        result.cards_results[cardIdStr] = {
          name: cardName,
          error: `Failed to execute: ${errorMessage}`,
        };
      }
    }

    return result;
  },
});
