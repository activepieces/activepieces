import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';
import { knowledgeItemDropdown } from '../common/props';

export const startTraining = createAction({
  auth: aidbaseAuth,
  name: 'start_training',
  displayName: 'Start Training',
  description: 'Starts a training job on an existing knowledge base item (FAQ, website, video, etc.).',
  
  props: {
    knowledge_id: knowledgeItemDropdown, 
  },
  
 async run({ auth: apiKey, propsValue }) {
    const { knowledge_id } = propsValue;

    return await aidbaseClient.startTraining(apiKey, knowledge_id);
  },
});