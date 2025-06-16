import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';


export const newLabel = createTrigger({
  auth: gmailAuth,
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a new label is created in Gmail',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    // Store current labels to compare against
    const labels = await gmailCommon.getLabels(context.auth.access_token);
    await context.store.put('knownLabels', labels.labels.map((l: any) => l.id));
  },
  onDisable: async (context) => {
    await context.store.delete('knownLabels');
  },
  run: async (context) => {
    const knownLabels = await context.store.get('knownLabels') as string[] || [];
    const currentLabels = await gmailCommon.getLabels(context.auth.access_token);
    
    const newLabels = currentLabels.labels.filter((label: any) => 
      !knownLabels.includes(label.id) && label.type === 'user'
    );
    
    // Update known labels
    await context.store.put('knownLabels', currentLabels.labels.map((l: any) => l.id));
    
    return newLabels;
  },
  sampleData: {
    id: 'Label_sample_id',
    name: 'New Project Label',
    type: 'user',
    messageListVisibility: 'show',
    labelListVisibility: 'labelShow',
    messagesTotal: 0,
    messagesUnread: 0,
    threadsTotal: 0,
    threadsUnread: 0,
  },
});