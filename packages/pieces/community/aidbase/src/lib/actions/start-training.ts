import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';
import { knowledgeItemDropdown } from '../common/props';

export const startTraining = createAction({
  auth: aidbaseAuth,
  name: 'start_training',
  displayName: 'Start Training',
  description: 'Starts a training job on an existing knowledge base item (FAQ, website, video, etc.).',
  audience: 'both',
  aiMetadata: {
    description:
      'Triggers a training job for a single existing Aidbase knowledge base item (FAQ, website, video, etc.) so its content becomes answerable by the chatbot. Use after adding a knowledge source; requires the knowledge item id. Not idempotent: each call enqueues another training run.',
    idempotent: false,
  },

  props: {
    knowledge_id: knowledgeItemDropdown, 
  },
  
 async run({ auth: apiKey, propsValue }) {
    const { knowledge_id } = propsValue;

    return await aidbaseClient.startTraining(apiKey.secret_text, knowledge_id);
  },
});