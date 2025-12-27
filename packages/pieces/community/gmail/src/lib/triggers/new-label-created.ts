import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailRequests } from '../common/data';

export const gmailNewLabelCreatedTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_label_created',
  displayName: 'New Label Created',
  description: 'Triggers when a new label is created in Gmail',
  props: {},
  sampleData: {
    id: 'Label_123',
    name: 'My New Label',
    type: 'user',
    messageListVisibility: 'show',
    labelListVisibility: 'labelShow',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const response = await GmailRequests.getLabels(context.auth);
    const labelIds = response.body.labels.map((label) => label.id);
    await context.store.put('knownLabelIds', JSON.stringify(labelIds));
  },
  async onDisable(context) {
    return;
  },
  async run(context) {
    const knownLabelIdsJson = (await context.store.get<string>('knownLabelIds')) ?? '[]';
    const knownLabelIds: string[] = JSON.parse(knownLabelIdsJson);

    const response = await GmailRequests.getLabels(context.auth);
    const currentLabels = response.body.labels;

    // Find new labels
    const newLabels = currentLabels.filter((label) => !knownLabelIds.includes(label.id));

    // Update known labels
    const currentLabelIds = currentLabels.map((label) => label.id);
    await context.store.put('knownLabelIds', JSON.stringify(currentLabelIds));

    return newLabels;
  },
  async test(context) {
    const response = await GmailRequests.getLabels(context.auth);
    // Return user-created labels only for testing
    return response.body.labels
      .filter((label) => label.type === 'user')
      .slice(0, 5);
  },
});
