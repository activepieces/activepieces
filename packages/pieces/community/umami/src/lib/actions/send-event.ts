import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiCommon } from '../common';

export const sendEvent = createAction({
  auth: umamiAuth,
  name: 'send_event',
  displayName: 'Send Event',
  description: 'Send a custom event or pageview to Umami. This uses the public tracking endpoint (no authentication required by the API, but uses your server URL).',
  props: {
    websiteId: umamiCommon.websiteDropdown,
    url: Property.ShortText({
      displayName: 'Page URL',
      description: 'The URL path of the page (e.g. "/pricing").',
      required: true,
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      description: 'Name of the custom event (e.g. "signup-button-click"). Leave empty to track a simple pageview.',
      required: false,
    }),
    eventData: Property.Object({
      displayName: 'Event Data',
      description: 'Additional key-value data to attach to the event.',
      required: false,
    }),
    referrer: Property.ShortText({
      displayName: 'Referrer',
      description: 'The referrer URL.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Page Title',
      description: 'Title of the page.',
      required: false,
    }),
  },
  async run(context) {
    const { base_url } = context.auth.props;
    const { websiteId, url, eventName, eventData, referrer, title } = context.propsValue;

    const baseUrl = base_url.replace(/\/+$/, '');

    const payload: Record<string, unknown> = {
      website: websiteId,
      url,
    };
    if (referrer) payload['referrer'] = referrer;
    if (title) payload['title'] = title;
    if (eventName) {
      payload['name'] = eventName;
      if (eventData && Object.keys(eventData).length > 0) {
        payload['data'] = eventData;
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/send`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Activepieces/1.0)',
      },
      body: {
        type: 'event',
        payload,
      },
    });

    return { success: response.status >= 200 && response.status < 300 };
  },
});
