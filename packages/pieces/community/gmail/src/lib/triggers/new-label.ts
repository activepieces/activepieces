import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { getFirstFiveOrAll } from '../common/data';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'labels';

export const gmailNewLabelTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a new label is created.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    const labels = response.data.labels || [];

    const existingLabelIds = labels.map((label) => label.id);
    await context.store.put(TRIGGER_KEY, JSON.stringify(existingLabelIds));
  },
  async onDisable(context) {
    await context.store.delete(TRIGGER_KEY);
  },
  async test(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    const labels = response.data.labels || [];

    return getFirstFiveOrAll(labels);
  },
  async run(context) {
    const existingIds = (await context.store.get<string>(TRIGGER_KEY)) ?? '[]';
    const parsedExistingIds = JSON.parse(existingIds) as string[];

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    if (isNil(response.data.labels) || response.data.labels.length === 0) {
      await context.store.put(TRIGGER_KEY, '[]');
      return [];
    }

    const allCurrentIds = response.data.labels.map((label) => label.id);

    const newLables = response.data.labels.filter((label) => {
      const labelId = label.id ?? undefined;
      return labelId !== undefined && !parsedExistingIds.includes(labelId);
    });

    await context.store.put(TRIGGER_KEY, JSON.stringify(allCurrentIds));

    if (newLables.length === 0) {
      return [];
    }

    return newLables;
  },
});
