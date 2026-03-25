import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { partnerstackAuth } from '../auth';
import { PartnerStackPartnership, partnerstackApiCall } from '../common/client';

export const getPartnerAction = createAction({
  auth: partnerstackAuth,
  name: 'get_partner',
  displayName: 'Get Partner',
  description: 'Retrieve a PartnerStack partnership by partner key, partnership key, or partner email.',
  props: {
    uniqueIdentifier: Property.ShortText({
      displayName: 'Unique Identifier',
      description: 'Partner key, internal partnership key, or partner email.',
      required: true,
    }),
  },
  async run(context) {
    return await partnerstackApiCall<PartnerStackPartnership>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: `/v2/partnerships/${encodeURIComponent(context.propsValue.uniqueIdentifier)}`,
    });
  },
});
