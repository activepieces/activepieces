import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooUpdateDomainSettingsOutputSchema } from '../../output-schemas';

export const mailerooUpdateDomainSettings = createAction({
  auth: mailerooAuth,
  name: 'maileroo_update_domain_settings',
  outputSchema: mailerooUpdateDomainSettingsOutputSchema,
  displayName: 'Update Domain Settings',
  description: 'Updates a domain\'s tracking settings.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes open/click tracking, custom tracking hostname (paid plans only) and the return-path local part of a domain. Only supplied fields change; omitted ones keep their value. Get the domain_id from maileroo_list_domains. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    domain_id: Property.Number({
      displayName: 'Domain ID',
      description: 'Numeric domain ID. Get it from maileroo_list_domains.',
      required: true,
    }),
    interaction_tracking: Property.StaticDropdown({
      displayName: 'Open/Click Tracking',
      description: 'Leave unset to keep the current value.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    custom_hostname_tracking: Property.StaticDropdown({
      displayName: 'Custom Hostname Tracking',
      description: 'Requires a paid plan. Leave unset to keep the current value.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    return_path: Property.ShortText({
      displayName: 'Return Path',
      description: 'Return-path local part, at most 24 characters.',
      required: false,
    }),
  },
  async run(context) {
    const { domain_id, interaction_tracking, custom_hostname_tracking, return_path } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/domains/${encodeURIComponent(domain_id)}/settings`,
      body: {
        ...spreadIfDefined('interaction_tracking', mailerooClient.optionalBoolean(interaction_tracking)),
        ...spreadIfDefined('custom_hostname_tracking', mailerooClient.optionalBoolean(custom_hostname_tracking)),
        ...spreadIfDefined('return_path', return_path),
      },
    });
  },
});
