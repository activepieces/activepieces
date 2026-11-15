import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';

export const updateUserSettings = createAction({
  auth: jotformAuth,
  name: 'jotform_update_user_settings',
  classification: 'WRITE',
  displayName: 'Update User Settings',
  description: "Update one or more of the connected account's account settings.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Updates the connected account's account settings from a key/value map, e.g. {\"time_format\":\"24\"}. Only the supplied keys change; every other setting is left alone. Idempotent — setting the same value again is a no-op.",
    idempotent: true,
  },
  props: {
    settings: Property.Json({
      displayName: 'Settings',
      description: 'Key/value map of settings to update, e.g. {"time_format":"24"}.',
      required: true,
    }),
  },
  async run(context) {
    const { settings } = context.propsValue;
    if (
      typeof settings !== 'object' ||
      settings === null ||
      Array.isArray(settings)
    ) {
      throw new Error('settings must be a JSON object of key/value pairs.');
    }
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: '/user/settings',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: settings as Record<string, unknown>,
      form: true,
    });
  },
});
