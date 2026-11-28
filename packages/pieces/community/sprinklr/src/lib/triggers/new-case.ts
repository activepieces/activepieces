import { pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCase } from '../common/case';
import { sprinklrCaseTrigger } from './common';

const polling = sprinklrCaseTrigger.polling('createdTime');

export const newCase = createTrigger({
  auth: sprinklrAuth,
  name: 'new_case',
  displayName: 'New Case',
  description: 'Fires when a case is created.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each Sprinklr case created after the flow was turned on, optionally only cases in one queue. Each event is one case with its number, subject, status, priority, contact, queues and custom fields. Polling-based; events arrive on the next check, not instantly.',
  },
  type: TriggerStrategy.POLLING,
  props: sprinklrCaseTrigger.props(),
  sampleData: sprinklrCase.sampleData,
  outputSchema: sprinklrCase.outputSchema,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await sprinklrCaseTrigger.recent({ auth: context.auth, propsValue: context.propsValue, timeKey: 'createdTime' });
  },
});
