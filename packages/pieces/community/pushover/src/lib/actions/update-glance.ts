import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';

export const updateGlance = createAction({
  auth: pushoverAuth,
  name: 'update_glance',
  classification: 'WRITE',
  displayName: 'Update Glance Widget',
  description: 'Update the Pushover glance widget fields on the user devices',
  audience: 'ai',
  aiMetadata: {
    description:
      'Silently update the Pushover glance widget on the recipient devices without sending a notification. Use it for a continuously refreshed status number or line of text, and use Send Push Message when the person should actually be alerted. At least one of title, text, subtext, count or percent is required. Fields persist between calls: omit a field to leave its current value alone. This action only sets field values and cannot clear a field once it has one. A registered widget is required and the Apple Watch is the only supported widget, so a success response on an account without one proves the call shape only. Safe to retry: the same values converge on the same widget state.',
    idempotent: true,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description:
        'Short description of the data, maximum 100 characters. Omit to leave unchanged. Values cannot be cleared once set.',
      required: false,
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description:
        'Main line of text, maximum 100 characters. Omit to leave unchanged. Values cannot be cleared once set.',
      required: false,
    }),
    subtext: Property.ShortText({
      displayName: 'Subtext',
      description:
        'Second line of text, maximum 100 characters. Omit to leave unchanged. Values cannot be cleared once set.',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Count',
      description:
        'Integer shown on the widget, may be negative. Omit to leave unchanged.',
      required: false,
    }),
    percent: Property.Number({
      displayName: 'Percent',
      description:
        'Integer from 0 to 100 rendered as a progress bar. Omit to leave unchanged.',
      required: false,
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description:
        'Update only this device name. All devices are updated when omitted.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fields = {
      ...(isFilled(propsValue.title) ? { title: propsValue.title } : {}),
      ...(isFilled(propsValue.text) ? { text: propsValue.text } : {}),
      ...(isFilled(propsValue.subtext)
        ? { subtext: propsValue.subtext }
        : {}),
      ...(propsValue.count !== undefined ? { count: propsValue.count } : {}),
      ...(propsValue.percent !== undefined
        ? { percent: propsValue.percent }
        : {}),
    };
    if (Object.keys(fields).length === 0) {
      throw new Error(
        'Update Glance Widget needs at least one of title, text, subtext, count or percent.'
      );
    }

    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: '/glances.json',
      body: {
        token: auth.props.api_token,
        user: auth.props.user_key,
        ...fields,
        ...(propsValue.device ? { device: propsValue.device } : {}),
      },
    });
  },
});

function isFilled(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
}
