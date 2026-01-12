import { AppConnectionValueForAuthProperty, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { currentYear } from '../common';
import { ClockodoClient } from '../common/client';
import { clockodoAuth } from '../../';

const polling: Polling<AppConnectionValueForAuthProperty<typeof clockodoAuth>, unknown> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {

    const client = new ClockodoClient(
      auth.props.email,
      auth.props.token,
      auth.props.company_name,
      auth.props.company_email
    );
    const res = await client.listAbsences({ year: currentYear() });
    return res.absences
      .sort((a, b) => b.id - a.id)
      .map((a) => ({
        id: a.id,
        data: a,
      }));
  },
};

export default createTrigger({
  auth: clockodoAuth,
  name: 'new_absence_enquiry',
  displayName: 'New Absence Enquiry',
  description: 'Triggers when a new absence enquiry is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
