import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';

export const getUserSettingByKey = createAction({
  auth: jotformAuth,
  name: 'jotform_get_user_setting_by_key',
  classification: 'READ',
  displayName: 'Get User Setting by Key',
  description: 'Get a single account setting value by its key.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the value of a single account setting by its key, e.g. "time_format". Resolve the available keys with Get User Settings.',
    idempotent: true,
  },
  props: {
    settingsKey: Property.ShortText({
      displayName: 'Settings Key',
      description: 'The setting key to read, e.g. "time_format".',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/user/settings/${context.propsValue.settingsKey}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
