import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { voipstudioAuth } from '../common/auth';
import { makeRequest } from '../common/client';

interface CallTrackingCampaign {
  id: number;
  calldate: string;
  [key: string]: unknown;
}

interface CampaignsResponse {
  data: CallTrackingCampaign[];
  total: number;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof voipstudioAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const response = await makeRequest<CampaignsResponse>(
      auth.secret_text,
      HttpMethod.GET,
      '/calltracking/campaigns'
    );

    return response.data
      .filter((item) => dayjs(item.calldate).valueOf() > lastFetchEpochMS)
      .map((item) => ({
        epochMilliSeconds: dayjs(item.calldate).valueOf(),
        data: item,
      }));
  },
};

export const callTracking = createTrigger({
  auth: voipstudioAuth,
  name: 'callTracking',
  displayName: 'Call Tracking',
  description:
    'Triggers when call associated with Call Tracking campaign visits is finished.',
  props: {},
  sampleData: {
    id: 6743,
    billsec: 431,
    call_id: 8451,
    calldate: '2017-05-17 06:14:18',
    charge: 9.13,
    clid: 'value',
    context: 'value',
    destination: 1,
    disposition: 1,
    dst: '13103345244',
    dst_codec: 'value',
    dst_id: 'value',
    dst_name: 'value',
    dst_ua: 'value',
    duration: 9077,
    info: 'value',
    is_root: true,
    live_id: 8429,
    parent_live_id: 7211,
    rate: 7.33,
    root_live_id: 6084,
    server_id: 7627,
    sip_endpoint_id: 8790,
    src: '44779243705',
    src_codec: 'value',
    src_id: 'value',
    src_name: 'value',
    src_ua: 'value',
    t_cause: 'value',
    type: 0,
    user_id: 153,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
