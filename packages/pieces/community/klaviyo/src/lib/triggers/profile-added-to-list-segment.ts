import {
  createTrigger,
  TriggerStrategy,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { klaviyoApi, pathFor } from '../common/client';
import { listOptions, segmentOptions } from '../common/props';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

const props = {
  targetType: Property.StaticDropdown({
    displayName: 'Target Type',
    description: 'Monitor a list or segment for new profile additions.',
    required: true,
    options: {
      options: [
        { label: 'List', value: 'list' },
        { label: 'Segment', value: 'segment' },
      ],
    },
  }),
  listId: Property.Dropdown({
    displayName: 'List',
    description: 'Select the list to monitor for new profile additions, or type its exact name.',
    required: false,
    auth: klaviyoAuth,
    refreshers: ['auth', 'targetType'],
    refreshOnSearch: true,
    options: async ({ auth, targetType }, { searchValue }) => {
      if (targetType !== 'list') {
        return { disabled: true, placeholder: 'Choose List as the target type', options: [] };
      }
      return listOptions({ auth, searchValue });
    },
  }),
  segmentId: Property.Dropdown({
    displayName: 'Segment',
    description: 'Select the segment to monitor for new profile additions, or type its exact name.',
    required: false,
    auth: klaviyoAuth,
    refreshers: ['auth', 'targetType'],
    refreshOnSearch: true,
    options: async ({ auth, targetType }, { searchValue }) => {
      if (targetType !== 'segment') {
        return { disabled: true, placeholder: 'Choose Segment as the target type', options: [] };
      }
      return segmentOptions({ auth, searchValue });
    },
  }),
};

export const profileAddedToListOrSegmentTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list_or_segment',
  classification: 'READ',
  displayName: 'Profile Added to List/Segment',
  description: 'Triggers when a profile is added to a specific list or segment.',
  aiMetadata: {
    description: 'Fires when a profile joins a chosen Klaviyo list or segment, polling by the profile join timestamp. The monitored target is configurable as either a specific list or a specific segment, so each event represents one profile newly added to that particular group.',
  },
  props,
  outputSchema: klaviyoOutputSchemas.triggerGroupProfile,
  sampleData: {
    id: '01JZTTZ2NNC8ZCP45SM4J84RG2',
    email: 'sarah.mason@klaviyo-demo.com',
    phone_number: '+15005550006',
    external_id: null,
    first_name: 'Sarah',
    last_name: 'Mason',
    full_name: 'Sarah Mason',
    organization: null,
    locale: null,
    title: 'Regional Manager',
    image: null,
    created: '2025-07-10T18:53:32+00:00',
    updated: '2025-07-10T18:53:32+00:00',
    joined_group_at: '2025-07-16T10:00:00+00:00',
    last_event_date: null,
    address1: null,
    address2: null,
    city: null,
    country: null,
    region: null,
    zip: null,
    timezone: null,
    ip: null,
    latitude: null,
    longitude: null,
    target_type: 'list',
    target_id: 'RB89mt',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

const POLL_CAP = 1000;

const polling: Polling<KlaviyoAuthValue, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { targetType, listId, segmentId } = propsValue;
    if (targetType === 'list' && !listId) {
      throw new Error('Please select a list to monitor.');
    }
    if (targetType === 'segment' && !segmentId) {
      throw new Error('Please select a segment to monitor.');
    }
    const targetId = targetType === 'list' ? listId : segmentId;
    if (targetId === undefined || targetId === null || targetId === '') {
      throw new Error('Please select a list or segment to monitor.');
    }
    const since = lastFetchEpochMS
      ? new Date(lastFetchEpochMS).toISOString()
      : dayjs().subtract(24, 'hours').toISOString();
    const profiles = await klaviyoApi.pollAfter({
      auth,
      path: `${pathFor([targetType === 'list' ? 'lists' : 'segments', String(targetId)])}/profiles`,
      field: 'joined_group_at',
      since,
      cap: POLL_CAP,
    });
    return profiles.map((profile) => {
      const joinedAt = profile.attributes['joined_group_at'];
      return {
        epochMilliSeconds: dayjs(String(joinedAt ?? profile.attributes['created'])).valueOf(),
        data: {
          ...klaviyoInputs.triggerProfile(profile),
          joined_group_at: joinedAt ?? null,
          target_type: targetType,
          target_id: targetId,
        },
      };
    });
  },
};
