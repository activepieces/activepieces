import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aconexAuth } from '../auth';
import { projectIdProp } from '../props';
import { ensureCursor, loadPollingItems } from './polling';

type AuthValue = AppConnectionValueForAuthProperty<typeof aconexAuth>;
type Props = { projectId: string };

const polling: Polling<AuthValue, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, store, propsValue, lastFetchEpochMS }) =>
    loadPollingItems({ kind: 'document', auth, store, propsValue, lastFetchEpochMS }),
};

export const newOrUpdatedDocumentTrigger = createTrigger({
  auth: aconexAuth,
  name: 'new_or_updated_document',
  displayName: 'New or Updated Document',
  description:
    'Polls document versions changed from a stored UTC hour forward, including a new version of the same tracking id. Each run returns at most the oldest 25 unseen metadata records. The file is not downloaded.',
  props: {
    projectId: projectIdProp,
  },
  sampleData: {
    '@DocumentId': '1879093137',
    TrackingId: '271341877549172398',
    DocumentNumber: 'DWG-001',
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
