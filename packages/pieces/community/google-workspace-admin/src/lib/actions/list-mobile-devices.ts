import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';

export const listMobileDevices = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_mobile_devices',
  classification: 'SEARCH',
  displayName: 'List Mobile Devices',
  description: 'Lists mobile devices managed by your organization.',
  audience: 'both',
  aiMetadata: {
    description:
      'List mobile devices enrolled in Google endpoint management, optionally filtered with a search query (e.g. "email:jane@yourcompany.com" or "status:pending"). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'e.g. "email:jane@yourcompany.com", "status:pending" or "model:pixel". See https://developers.google.com/admin-sdk/directory/v1/search-operators.',
      required: false,
    }),
    limit: Property.Number({ displayName: 'Max Results', required: false, defaultValue: 100 }),
  },
  async run({ auth, propsValue }) {
    const devices = await googleAdminClient.listAll<{ nextPageToken?: string; mobiledevices?: MobileDevice[] }, MobileDevice>({
      auth,
      url: `${DIRECTORY_URL}/customer/my_customer/devices/mobile`,
      getItems: (r) => r.mobiledevices,
      queryParams: { projection: 'FULL', query: propsValue.query },
      limit: propsValue.limit ?? 100,
    });
    return devices.map((d) => ({
      resource_id: d.resourceId,
      device_id: d.deviceId ?? null,
      owner_emails: (d.email ?? []).join(', '),
      owner_names: (d.name ?? []).join(', '),
      model: d.model ?? null,
      os: d.os ?? null,
      type: d.type ?? null,
      status: d.status ?? null,
      serial_number: d.serialNumber ?? null,
      imei: d.imei ?? null,
      meid: d.meid ?? null,
      wifi_mac_address: d.wifiMacAddress ?? null,
      compromised_status: d.deviceCompromisedStatus ?? null,
      first_sync: d.firstSync ?? null,
      last_sync: d.lastSync ?? null,
    }));
  },
});

type MobileDevice = {
  resourceId: string;
  deviceId?: string;
  email?: string[];
  name?: string[];
  model?: string;
  os?: string;
  type?: string;
  status?: string;
  serialNumber?: string;
  imei?: string;
  meid?: string;
  wifiMacAddress?: string;
  deviceCompromisedStatus?: string;
  firstSync?: string;
  lastSync?: string;
};
