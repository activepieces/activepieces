import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewLabelTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_label',
  displayName: 'New Label',
  description: 'Triggers when a new label is created in Gmail',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Get initial label list
    const labelsResponse = await gmail.users.labels.list({
      userId: 'me',
    });

    const labelIds = (labelsResponse.data.labels || [])
      .filter((label) => label.type === 'user')
      .map((label) => label.id);

    await context.store.put('knownLabelIds', JSON.stringify(labelIds));
  },
  async onDisable(context) {
    await context.store.delete('knownLabelIds');
  },
  async run(context) {
    const knownLabelIdsJson =
      (await context.store.get<string>('knownLabelIds')) ?? '[]';
    const knownLabelIds = new Set(JSON.parse(knownLabelIdsJson));

    const newLabels = await pollNewLabels({
      auth: context.auth,
      knownLabelIds,
    });

    // Update known label IDs
    newLabels.forEach((label) => {
      if (label.id) {
        knownLabelIds.add(label.id);
      }
    });
    await context.store.put(
      'knownLabelIds',
      JSON.stringify(Array.from(knownLabelIds))
    );

    return newLabels;
  },
  async test(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Get user labels (excluding system labels)
    const labelsResponse = await gmail.users.labels.list({
      userId: 'me',
    });

    const userLabels = (labelsResponse.data.labels || [])
      .filter((label) => label.type === 'user')
      .slice(0, 5);

    return userLabels;
  },
});

async function pollNewLabels({
  auth,
  knownLabelIds,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  knownLabelIds: Set<string>;
}): Promise<any[]> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  // Get current label list
  const labelsResponse = await gmail.users.labels.list({
    userId: 'me',
  });

  // Filter for user labels that we haven't seen before
  const newLabels = (labelsResponse.data.labels || [])
    .filter((label) => label.type === 'user' && !knownLabelIds.has(label.id!))
    .map((label) => ({
      id: label.id,
      name: label.name,
      type: label.type,
      messageListVisibility: label.messageListVisibility,
      labelListVisibility: label.labelListVisibility,
      color: label.color,
      messagesTotal: label.messagesTotal,
      messagesUnread: label.messagesUnread,
      threadsTotal: label.threadsTotal,
      threadsUnread: label.threadsUnread,
    }));

  return newLabels;
}
