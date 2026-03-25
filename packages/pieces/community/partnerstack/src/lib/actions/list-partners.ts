import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { partnerstackAuth } from '../auth';
import { PartnerStackListResponse, PartnerStackPartnership, partnerstackApiCall } from '../common/client';

export const listPartnersAction = createAction({
  auth: partnerstackAuth,
  name: 'list_partners',
  displayName: 'List Partners',
  description: 'List PartnerStack partnerships.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    approvedStatus: Property.StaticDropdown({
      displayName: 'Approved Status',
      required: false,
      options: {
        options: [
          { label: 'Approved', value: 'approved' },
          { label: 'Pending', value: 'pending' },
          { label: 'Declined', value: 'declined' },
        ],
      },
    }),
    includeArchived: Property.Checkbox({
      displayName: 'Include Archived',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 25,
    }),
    startingAfter: Property.ShortText({
      displayName: 'Starting After',
      required: false,
    }),
    endingBefore: Property.ShortText({
      displayName: 'Ending Before',
      required: false,
    }),
  },
  async run(context) {
    return await partnerstackApiCall<PartnerStackListResponse<PartnerStackPartnership>>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: '/v2/partnerships',
      query: {
        email: context.propsValue.email,
        approved_status: context.propsValue.approvedStatus,
        include_archived: context.propsValue.includeArchived,
        limit: context.propsValue.limit,
        starting_after: context.propsValue.startingAfter,
        ending_before: context.propsValue.endingBefore,
      },
    });
  },
});
