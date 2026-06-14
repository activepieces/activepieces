import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { munaAiAuth } from '../auth';

export const createPrediction = createAction({
  audience: 'human',
  name: 'create_prediction',
  displayName: 'Create Prediction',
  description: 'Run a predictor and get back prediction resources.',
  auth: munaAiAuth,
  props: {
    tag: Property.ShortText({
      displayName: 'Predictor Tag',
      description: 'The tag of the predictor to run (e.g. `@org/my-model`).',
      required: true,
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description:
        'A unique identifier for the client making the prediction. Used to track usage per device or user.',
      required: true,
    }),
    configurationId: Property.ShortText({
      displayName: 'Configuration ID',
      description: 'Optional predictor configuration identifier.',
      required: false,
    }),
    deviceId: Property.ShortText({
      displayName: 'Device ID',
      description:
        'Optional device identifier. Muna uses this to choose the optimal implementation to respond with.',
      required: false,
    }),
    predictionId: Property.ShortText({
      displayName: 'Prediction ID',
      description:
        'For embedded predictors — providing the original prediction ID ensures the same implementation is delivered.',
      required: false,
    }),
  },
  async run(context) {
    const { tag, clientId, configurationId, deviceId, predictionId } =
      context.propsValue;

    const body: Record<string, string> = { tag, clientId };

    if (configurationId) body['configurationId'] = configurationId;
    if (deviceId) body['deviceId'] = deviceId;
    if (predictionId) body['predictionId'] = predictionId;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.muna.ai/v1/predictions',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const prediction = response.body as {
      id: string;
      tag: string;
      configuration?: string;
      resources: Array<{ type: string; url: string; name?: string }>;
      created: string;
    };

    return {
      id: prediction.id,
      tag: prediction.tag,
      configuration: prediction.configuration ?? null,
      created: prediction.created,
      resources: prediction.resources.map((r) => ({
        type: r.type,
        url: r.url,
        name: r.name ?? null,
      })),
    };
  },
});
