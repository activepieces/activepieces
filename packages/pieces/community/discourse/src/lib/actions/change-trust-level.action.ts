/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { discourseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const changeUserTrustLevel = createAction({
  auth: discourseAuth,
  name: 'change_user_trust_level',
  description: 'Change the trust level of a user',
  displayName: 'Change User Trust Level',
  props: {
    user_id: Property.ShortText({
      description: 'ID of the user',
      displayName: 'User ID',
      required: true,
    }),
    new_trust_level: Property.Dropdown({
      description: 'New trust level of the user',
      displayName: 'New Trust Level',
      auth: discourseAuth,
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your discourse account',
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${auth.props.website_url.trim()}/site.json`,
          headers: {
            'Api-Key': auth.props.api_key,
            'Api-Username': auth.props.api_username,
          },
        });

        const result: { name: string; value: number }[] = [];
        const trust_levels = response.body['trust_levels'];
        for (const key in trust_levels) {
          result.push({ name: key, value: trust_levels[key] });
        }

        const options = result.map((res) => {
          return {
            label: res.name,
            value: res.value,
          };
        });
        return {
          options: options,
          disabled: false,
        };
      },
      refreshers: [],
    }),
  },
  async run(context) {
    const { user_id, new_trust_level } = context.propsValue;
    return await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${context.auth.props.website_url.trim()}/u/${user_id}.json`,
      headers: {
        'Api-Key': context.auth.props.api_key,
        'Api-Username': context.auth.props.api_username,
      },
      body: {
        trust_level: new_trust_level,
      },
    });
  },
});
