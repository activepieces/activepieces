import { pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCase } from '../common/case';
import { sprinklrCaseTrigger } from './common';

const polling = sprinklrCaseTrigger.polling('modifiedTime');

export const updatedCase = createTrigger({
  auth: sprinklrAuth,
  name: 'updated_case',
  displayName: 'Updated Case',
  description: 'Fires when a case is created or changed.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when a Sprinklr case is created or any of its fields changes after the flow was turned on, optionally only cases in one queue. Each event is one case in its current state (no diff of what changed); several changes between two checks give one event. Polling-based; events arrive on the next check, not instantly.',
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
    return await sprinklrCaseTrigger.recent({ auth: context.auth, propsValue: context.propsValue, timeKey: 'modifiedTime' });
  },
});
