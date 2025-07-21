import { createAction, Property } from '@activepieces/pieces-framework';
import { queryMetabaseApi } from '../common';
import { metabaseAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';

interface MetabaseParam {
  id: string;
  slug: string;
  name?: string;
}

export const embedQuestion = createAction({
  name: 'embedQuestion',
  auth: metabaseAuth,
  requireAuth: true,
  displayName: 'Embed question',
  description:
    'Enable embedding for a Metabase question and configure parameters',
  props: {
    questionId: Property.ShortText({
      displayName: 'Metabase question ID',
      required: true,
    }),
    enableEmbedding: Property.Checkbox({
      displayName: 'Enable embedding',
      description: 'Whether to enable embedding for this question',
      required: true,
      defaultValue: true,
    }),
    parameterSettings: Property.DynamicProperties({
      displayName: 'Parameter settings',
      description:
        'Configure how each parameter should be handled in the embed',
      required: false,
      refreshers: ['questionId', 'enableEmbedding'],
      props: async ({ auth, questionId, enableEmbedding }) => {
        if (!questionId || !enableEmbedding) {
          return {};
        }

        try {
          const card = await queryMetabaseApi(
            {
              endpoint: `card/${questionId.split('-')[0]}`,
              method: HttpMethod.GET,
            },
            { baseUrl: auth.baseUrl, apiKey: auth.apiKey }
          );

          const parameters = (card['parameters'] as MetabaseParam[]) || [];
          const props: Record<string, any> = {};

          // Get current embedding settings if they exist
          const currentEmbeddingParams = card.embedding_params || {};

          parameters.forEach((param) => {
            const paramName = param.name || param.slug;
            const currentSetting =
              currentEmbeddingParams[param.slug] || 'disabled';

            props[param.slug] = Property.StaticDropdown({
              displayName: paramName,
              description: `How to handle parameter: ${paramName}`,
              required: false,
              defaultValue: currentSetting,
              options: {
                options: [
                  { label: 'Disabled', value: 'disabled' },
                  { label: 'Editable', value: 'enabled' },
                  { label: 'Locked', value: 'locked' },
                ],
              },
            });
          });

          return props;
        } catch (error) {
          return {};
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const questionId = propsValue.questionId.split('-')[0];

    // First, get the current question details
    const card = await queryMetabaseApi(
      { endpoint: `card/${questionId}`, method: HttpMethod.GET },
      auth
    );

    const parameters = (card['parameters'] as MetabaseParam[]) || [];

    const updatePayload = {
      ...card,
      enable_embedding: propsValue.enableEmbedding,
    };

    // If parameter settings are provided, update the parameters
    // Create embedding_params object if parameter settings are provided
    if (propsValue.parameterSettings && parameters.length > 0) {
      const embeddingParams: Record<string, string> = {};

      parameters.forEach((param) => {
        const paramSetting = propsValue.parameterSettings?.[
          param.slug
        ] as string;
        if (paramSetting) {
          embeddingParams[param.slug] = paramSetting;
        } else {
          embeddingParams[param.slug] = 'disabled';
        }
      });

      updatePayload.embedding_params = embeddingParams;
    }

    // Update the card with embedding settings
    const response = await queryMetabaseApi(
      {
        endpoint: `card/${questionId}`,
        method: HttpMethod.PUT,
        body: updatePayload,
      },
      auth
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      success: true,
      message: propsValue.enableEmbedding
        ? 'Question embedding has been enabled successfully'
        : 'Question embedding has been disabled successfully',
      embeddingParams: propsValue.enableEmbedding
        ? updatePayload.embedding_params
        : {},
    };
  },
});
