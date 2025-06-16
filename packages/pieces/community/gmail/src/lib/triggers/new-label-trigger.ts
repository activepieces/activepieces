import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { gmailAuth } from '../../';

export const gmailNewLabelTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_label',
  displayName: 'New Label',
  description: 'Triggers when a new label is created in your Gmail account.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPollLabels', JSON.stringify([]));
  },
  async onDisable(context) {
    return;
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const labelsResponse = await gmail.users.labels.list({
      userId: 'me',
    });

    const previousLabelsJson =
      (await context.store.get<string>('lastPollLabels')) ?? '[]';
    const previousLabels = JSON.parse(previousLabelsJson);

    const currentLabels = labelsResponse.data.labels || [];
    const currentLabelIds = currentLabels.map((label) => label.id);

    const newLabels = currentLabels.filter(
      (label) => !previousLabels.includes(label.id)
    );

    await context.store.put('lastPollLabels', JSON.stringify(currentLabelIds));

    return newLabels.map((label) => ({
      labelId: label.id,
      labelName: label.name,
    }));
  },
  async test(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const labelsResponse = await gmail.users.labels.list({
      userId: 'me',
    });

    return labelsResponse.data.labels?.slice(0, 5) ?? [];
  },
});
