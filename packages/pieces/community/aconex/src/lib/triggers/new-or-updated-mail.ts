import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aconexAuth } from '../auth';
import { mailBoxProp, projectIdProp } from '../props';
import { ensureCursor, loadPollingItems } from './polling';

type AuthValue = AppConnectionValueForAuthProperty<typeof aconexAuth>;
type Props = { projectId: string; mailBox: string };

const polling: Polling<AuthValue, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, store, propsValue, lastFetchEpochMS }) =>
    loadPollingItems({ kind: 'mail', auth, store, propsValue, lastFetchEpochMS }),
};

export const newOrUpdatedMailTrigger = createTrigger({
  auth: aconexAuth,
  name: 'new_or_updated_mail',
  displayName: 'New or Updated Mail',
  description:
    'Polls mail changed from a stored UTC hour forward. Each run returns at most the oldest 25 unseen items. Getting mail does not mark it read.',
  props: {
    projectId: projectIdProp,
    mailBox: mailBoxProp,
  },
  sampleData: {
    Mail: {
      '@MailId': '1879053088',
      MailData: 'Example body',
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
      server: context.server,
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      server: context.server,
      isRepublish: context.isRepublish,
    });
    await ensureCursor(context.store);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
      server: context.server,
    });
  },
});
