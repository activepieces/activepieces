import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { bushbulletAuth } from './auth';
import { pushbulletApi } from './client';

const deviceDropdown = Property.Dropdown({
  auth: bushbulletAuth,
  displayName: 'Device',
  description:
    'Send the push to one of your devices only. Leave empty to send it to all of your devices. Do not combine with Email.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Pushbullet account first.' };
    }
    const response = await pushbulletApi.request<{ devices: PushbulletDevice[] }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/devices',
      queryParams: { active: 'true' },
    });
    const devices = (response.devices ?? []).filter((device) => device.pushable !== false);
    return {
      disabled: false,
      options: devices.map((device) => ({
        label: device.nickname || [device.manufacturer, device.model].filter(Boolean).join(' ') || device.iden,
        value: device.iden,
      })),
      placeholder: devices.length === 0 ? 'No devices found on this account.' : undefined,
    };
  },
});

const emailProp = Property.ShortText({
  displayName: 'Email',
  description:
    'Send the push to this email address instead of your own devices. If the person has no Pushbullet account they get an email. Do not combine with Device.',
  required: false,
});

export const pushbulletProps = {
  device: deviceDropdown,
  email: emailProp,
};

type PushbulletDevice = {
  iden: string;
  nickname?: string;
  manufacturer?: string;
  model?: string;
  pushable?: boolean;
};
