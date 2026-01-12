import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const getEmotionResults = createAction({
  name: 'get_emotion_results',
  displayName: 'Get Emotion Results',
  description: 'Retrieve emotion analysis predictions from a completed batch job',
  auth: humeAiAuth,
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The ID of the emotion analysis job to retrieve results for',
      required: true,
    }),
  },
  async run(context) {
    const client = new HumeClient({
      apiKey: context.auth.secret_text,
    });

    const { jobId } = context.propsValue;

    try {
      const predictions = await client.expressionMeasurement.batch.getJobPredictions(jobId);

      const jobDetails = await client.expressionMeasurement.batch.getJobDetails(jobId);

      return {
        jobId: jobId,
        status: jobDetails.state,
        predictions: predictions,
        predictionCount: predictions.length,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve emotion results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
