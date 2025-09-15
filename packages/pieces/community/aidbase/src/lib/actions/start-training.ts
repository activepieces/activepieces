import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth, aidbaseCommon } from '../../common';
import { StartTrainingProperties } from '../../common/properties';
import { StartTrainingSchema } from '../../common/schemas';

export const startTraining = createAction({
  auth: aidbaseAuth,
  name: 'startTraining',
  displayName: 'Start Training',
  description: 'Starts a training job on the existing knowledge base content (FAQs, websites, video, etc.).',
  props: StartTrainingProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, StartTrainingSchema);
    return await aidbaseCommon.startTraining({ apiKey, ...propsValue });
  },
});
