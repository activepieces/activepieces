import { createAction, Property } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const getRecentVisitsAction = createAction({
  name: 'get_recent_visits',
  classification: 'READ',
  auth: matomoAuth,
  displayName: 'Get Recent Visits',
  description: 'Get the latest visits with their visitor, referrer, device and page/event details.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the most recent visits to a Matomo site from the raw visitor log, newest first, without waiting for report archiving. Each visit has idVisit, visitorId, userId, serverTimestamp, serverDate, visitDuration, actions, visitorType, referrerType, referrerName, country, city, deviceType, browserName, operatingSystemName and actionDetails (each pageview or event with type, url, pageTitle, eventCategory, eventAction). limit 1-100 (default 10). siteId is optional (connection site otherwise). Visit data can include IP-derived location and user IDs. Read-only.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({ displayName: 'Limit', description: 'How many visits to return (1-100).', required: false, defaultValue: 10, placeholder: '10' }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Visits Returned', format: 'number' },
      { key: 'visits', label: 'Visits', labelKey: 'idVisit', listItems: matomoUtils.visitFields },
    ],
  },
  async run(context) {
    const { siteId, limit } = context.propsValue;
    const requested = limit !== undefined && limit !== null && Number.isFinite(limit) ? Math.trunc(limit) : 10;
    const filterLimit = Math.min(Math.max(requested, 1), 100);
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'Live.getLastVisitsDetails',
      idSite: siteId,
      params: { filter_limit: filterLimit, filter_offset: 0 },
    });
    const visits = matomoApi.toArray(response).filter(matomoApi.isRecord).map(matomoUtils.toVisit);
    return { count: visits.length, visits };
  },
});
