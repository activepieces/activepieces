import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

type KlaviyoProfile = {
  id: string;
  attributes: {
    created: string;
    updated: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
};

type Props = {
  list_or_segment: string;
  list_or_segment_id: string;
};

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const { list_or_segment, list_or_segment_id } = propsValue;
    const endpoint =
      list_or_segment === 'list'
        ? `/lists/${list_or_segment_id}/profiles`
        : `/segments/${list_or_segment_id}/profiles`;

    const response = await klaviyoApiCall<{ data: KlaviyoProfile[] }>({
      apiKey: auth as string,
      method: HttpMethod.GET,
      endpoint,
      queryParams: {
        'page[size]': '50',
        // Sort by `updated` descending — picks up profiles that were newly added
        // to the list (their `updated` timestamp changes on list membership change)
        sort: '-updated',
        'fields[profile]': 'id,email,first_name,last_name,created,updated',
      },
    });

    return (response.data ?? []).map((profile) => ({
      // Use `updated` as the dedup key so pre-existing profiles whose list
      // membership just changed (updated timestamp bumped) are still surfaced.
      epochMilliSeconds: new Date(profile.attributes.updated).valueOf(),
      data: profile,
    }));
  },
};

export const profileAddedToListSegmentTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list_segment',
  displayName: 'Profile Added to List/Segment',
  description:
    'Triggers when a profile is added to a specific list or segment.',
  type: TriggerStrategy.POLLING,
  props: {
    list_or_segment: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'List', value: 'list' },
          { label: 'Segment', value: 'segment' },
        ],
      },
    }),
    list_or_segment_id: Property.ShortText({
      displayName: 'List or Segment ID',
      description: 'The ID of the list or segment to monitor',
      required: true,
    }),
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue as Props,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue as Props,
    });
  },
  async test(context) {
    return pollingHelper.test(polling, {
      ...context,
      propsValue: context.propsValue as Props,
    });
  },
  async run(context) {
    return pollingHelper.poll(polling, {
      ...context,
      propsValue: context.propsValue as Props,
    });
  },
  sampleData: {
    id: 'XYZABC',
    type: 'profile',
    attributes: {
      email: 'john.smith@example.com',
      first_name: 'John',
      last_name: 'Smith',
      created: '2024-10-15T10:00:00+00:00',
      updated: '2024-10-15T10:00:00+00:00',
    },
  },
});
