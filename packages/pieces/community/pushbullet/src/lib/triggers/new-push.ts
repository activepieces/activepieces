import {
  AppConnectionValueForAuthProperty,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../common/auth';
import { PushbulletPush, pushbulletApi } from '../common/client';
import { pushbulletOutputSchemas } from '../common/output-schemas';

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const TEST_SAMPLE_SIZE = 5;

const polling: Polling<AppConnectionValueForAuthProperty<typeof bushbulletAuth>, { includeDismissed?: boolean }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const isTest = lastFetchEpochMS === 0;
    const pushes: PushbulletPush[] = [];
    let cursor: string | undefined = undefined;
    let page = 0;
    do {
      const queryParams: Record<string, string> = {
        active: 'true',
        limit: String(isTest ? TEST_SAMPLE_SIZE : PAGE_SIZE),
      };
      if (!isTest) {
        queryParams['modified_after'] = String(lastFetchEpochMS / 1000);
      }
      if (cursor) {
        queryParams['cursor'] = cursor;
      }
      const response: { pushes?: PushbulletPush[]; cursor?: string } = await pushbulletApi.request({
        token: auth.secret_text,
        method: HttpMethod.GET,
        path: '/pushes',
        queryParams,
      });
      pushes.push(...(response.pushes ?? []));
      cursor = isTest ? undefined : response.cursor;
      page++;
    } while (cursor && page < MAX_PAGES);
    if (cursor) {
      throw new Error(
        `More than ${MAX_PAGES * PAGE_SIZE} pushes arrived since the last check. The trigger stopped without saving progress so none are skipped; it will retry from the same point.`,
      );
    }

    return pushes
      .filter((push) => push.active && (propsValue.includeDismissed === true || !push.dismissed))
      .filter((push) => isTest || push.created * 1000 > lastFetchEpochMS)
      .map((push) => ({
        epochMilliSeconds: Math.floor(push.created * 1000),
        data: push,
      }));
  },
};

export const newPushTrigger = createTrigger({
  auth: bushbulletAuth,
  name: 'new_push',
  displayName: 'New Push',
  description: 'Triggers when a new push (note, link or file) appears on your Pushbullet account.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when a new push is created on the Pushbullet account, sent or received, emitting the push object (iden, type, title, body, url, sender). Polls by creation time, so pushes created since the last check are captured once each.',
  },
  props: {
    includeDismissed: Property.Checkbox({
      displayName: 'Include Dismissed Pushes',
      description: 'Also trigger for pushes that were already dismissed when the check ran.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: pushbulletOutputSchemas.push,
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    iden: 'ujpah72o0sjAoRtnM0jc',
    type: 'note',
    active: true,
    dismissed: false,
    created: 1735689600.123,
    modified: 1735689600.123,
    direction: 'self',
    sender_iden: 'ujpah72o0',
    sender_email: 'jane@example.com',
    sender_email_normalized: 'jane@example.com',
    sender_name: 'Jane Doe',
    receiver_iden: 'ujpah72o0',
    receiver_email: 'jane@example.com',
    receiver_email_normalized: 'jane@example.com',
    title: 'Build finished',
    body: 'The nightly build passed.',
  },
});
