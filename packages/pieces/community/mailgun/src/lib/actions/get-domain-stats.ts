import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';
import { mailgunCommon, mailgunApiCallAbsoluteUrl } from '../common';

export const getDomainStats = createAction({
  auth: mailgunAuth,
  name: 'get_domain_stats',
  displayName: 'Get Domain Stats',
  description:
    'Retrieve aggregated email statistics for a Mailgun domain (delivered, failed, opened, etc.). Useful for monitoring delivery health and detecting anomalies.',
  props: {
    domain: mailgunCommon.domainDropdown,
    event: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Select which event types to include in the statistics.',
      required: true,
      options: {
        options: [
          { label: 'Accepted', value: 'accepted' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Failed', value: 'failed' },
          { label: 'Opened', value: 'opened' },
          { label: 'Clicked', value: 'clicked' },
          { label: 'Complained', value: 'complained' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Stored', value: 'stored' },
        ],
      },
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description: 'Time period to aggregate stats over.',
      required: true,
      defaultValue: '1h',
      options: {
        options: [
          { label: 'Last 1 hour', value: '1h' },
          { label: 'Last 6 hours', value: '6h' },
          { label: 'Last 12 hours', value: '12h' },
          { label: 'Last 24 hours', value: '24h' },
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
        ],
      },
    }),
  },
  async run(context) {
    const { domain, event, duration } = context.propsValue;
    const auth = context.auth;

    const baseUrl =
      auth.props.region === 'eu'
        ? 'https://api.eu.mailgun.net'
        : 'https://api.mailgun.net';
    const params = new URLSearchParams({ duration });
    for (const e of event) {
      params.append('event', e);
    }

    const response = await mailgunApiCallAbsoluteUrl<{
      stats: {
        time: string;
        accepted?: { total: number };
        delivered?: { total: number };
        failed?: { permanent: { total: number }; temporary: { total: number } };
        opened?: { total: number };
        clicked?: { total: number };
        complained?: { total: number };
        unsubscribed?: { total: number };
        stored?: { total: number };
      }[];
    }>({
      apiKey: auth.props.api_key,
      url: `${baseUrl}/v3/${domain}/stats/total?${params.toString()}`,
    });

    const stats = response.body.stats;
    if (!stats || stats.length === 0) {
      return {
        duration,
        accepted: 0,
        delivered: 0,
        failed_permanent: 0,
        failed_temporary: 0,
        failed_total: 0,
        opened: 0,
        clicked: 0,
        complained: 0,
        unsubscribed: 0,
        stored: 0,
      };
    }

    let accepted = 0;
    let delivered = 0;
    let failedPermanent = 0;
    let failedTemporary = 0;
    let opened = 0;
    let clicked = 0;
    let complained = 0;
    let unsubscribed = 0;
    let stored = 0;

    for (const bucket of stats) {
      accepted += bucket.accepted?.total ?? 0;
      delivered += bucket.delivered?.total ?? 0;
      failedPermanent += bucket.failed?.permanent?.total ?? 0;
      failedTemporary += bucket.failed?.temporary?.total ?? 0;
      opened += bucket.opened?.total ?? 0;
      clicked += bucket.clicked?.total ?? 0;
      complained += bucket.complained?.total ?? 0;
      unsubscribed += bucket.unsubscribed?.total ?? 0;
      stored += bucket.stored?.total ?? 0;
    }

    return {
      duration,
      accepted,
      delivered,
      failed_permanent: failedPermanent,
      failed_temporary: failedTemporary,
      failed_total: failedPermanent + failedTemporary,
      opened,
      clicked,
      complained,
      unsubscribed,
      stored,
    };
  },
});
