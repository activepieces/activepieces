import { createAction, Property } from '@activepieces/pieces-framework';
import { randomBytes } from 'crypto';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps } from '../common/props';

export const trackEventAction = createAction({
  name: 'track_event',
  classification: 'WRITE',
  auth: matomoAuth,
  displayName: 'Track Event',
  description: 'Record a custom server-side event (category, action, name, value) in Matomo through the Tracking API.',
  audience: 'both',
  aiMetadata: {
    description:
      'Records a custom server-side event hit in Matomo through the Tracking API (sent as a server request, so it is stored even though it does not come from a browser), e.g. a signup, purchase step or server-side action. category and action are required; name and numeric value are optional. url is the optional full page URL the event belongs to. userId ties the hit to a known user; when userId is set Matomo derives the visitor ID from it, ignores visitorId and the output visitorId is null. visitorId is a 16-character hex visitor id (random when empty, which starts a new visitor). siteId is optional (connection site otherwise). The hit appears in Get Recent Visits right away and in reports after archiving. Returns tracked and visitorId. Not idempotent: every call records another event.',
    idempotent: false,
  },
  props: {
    category: Property.ShortText({ displayName: 'Event Category', description: 'For example Videos or Signup.', required: true, placeholder: 'Signup' }),
    action: Property.ShortText({ displayName: 'Event Action', description: 'For example Play or Submit.', required: true, placeholder: 'Click' }),
    name: Property.ShortText({ displayName: 'Event Name', description: 'An optional label for the event, such as the button or video name.', required: false, placeholder: 'Pricing CTA' }),
    value: Property.Number({ displayName: 'Event Value', description: 'A numeric value for the event.', required: false, placeholder: '29' }),
    url: Property.ShortText({ displayName: 'Page URL', description: 'The full URL the event happened on.', required: false, placeholder: 'https://example.com/pricing' }),
    userId: Property.ShortText({ displayName: 'User ID', description: 'Your own ID for a logged-in user.', required: false }),
    visitorId: Property.ShortText({
      displayName: 'Visitor ID',
      description: '16 hex characters; empty for a new visitor. Ignored when User ID is set.',
      placeholder: 'a1b2c3d4e5f60718',
      required: false,
    }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'tracked', label: 'Tracked', format: 'boolean' },
      { key: 'visitorId', label: 'Visitor ID', description: 'Empty when User ID was set, because Matomo derives the visitor from it.' },
      { key: 'siteId', label: 'Site ID' },
    ],
  },
  async run(context) {
    const { category, action, name, value, url, userId, visitorId, siteId } = context.propsValue;
    const auth = context.auth.props;
    const cleanVisitorId = (visitorId ?? '').trim().toLowerCase();
    if (cleanVisitorId !== '' && !/^[0-9a-f]{16}$/.test(cleanVisitorId)) {
      throw new Error('Visitor ID must be exactly 16 hexadecimal characters.');
    }
    const resolvedVisitorId = cleanVisitorId === '' ? randomBytes(8).toString('hex') : cleanVisitorId;
    const resolvedSiteId = siteId && siteId.trim() !== '' ? siteId.trim() : auth.siteId;
    await matomoApi.track({
      auth,
      params: {
        idsite: resolvedSiteId,
        e_c: category,
        e_a: action,
        e_n: name,
        e_v: value,
        url: url && url.trim() !== '' ? url.trim() : undefined,
        uid: userId,
        _id: resolvedVisitorId,
        apiv: 1,
        send_image: 0,
        bots: 1,
      },
    });
    const userIdSet = userId !== undefined && userId !== null && userId.trim() !== '';
    return { tracked: true, visitorId: userIdSet ? null : resolvedVisitorId, siteId: resolvedSiteId };
  },
});
