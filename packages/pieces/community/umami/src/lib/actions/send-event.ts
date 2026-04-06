import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth, UmamiAuthValue } from '../auth';
import { umamiCommon } from '../common';
import { AppConnectionType } from '@activepieces/shared';

export const sendEvent = createAction({
  auth: umamiAuth,
  name: 'send_event',
  displayName: 'Send Event',
  description:
    'Records a custom event or pageview on a website. Leave the event name blank to track a plain pageview.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
    url: Property.ShortText({
      displayName: 'Page Path',
      description: 'Path of the page to record, e.g. /pricing.',
      required: true,
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      description:
        'Name of the custom event, e.g. signup-button-click. Leave blank to record a pageview.',
      required: false,
    }),
    eventData: Property.Object({
      displayName: 'Event Properties',
      description: 'Extra key-value pairs to attach to the event.',
      required: false,
    }),
    referrer: Property.ShortText({
      displayName: 'Referrer',
      description: 'URL the visitor came from.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Page Title',
      description: 'Title of the page being recorded.',
      required: false,
    }),
  },
  async run(context) {
    const { websiteId, url, eventName, eventData, referrer, title } =
      context.propsValue;
    const auth = context.auth as UmamiAuthValue;
    const sendUrl = auth.type === AppConnectionType.SECRET_TEXT
      ? 'https://cloud.umami.is/api/send'
      : `${auth.props.baseUrl.replace(/\/+$/, '')}/api/send`;

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
      url: sendUrl,
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
