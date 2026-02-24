import { createAction, Property } from '@activepieces/pieces-framework';
import { appfollowAuth } from '../common/auth';
import {
  application_ext_idDropdown,
  collection_idDropdown,
  review_ID_Dropdown,
} from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const replyToReview = createAction({
  auth: appfollowAuth,
  name: 'replyToReview',
  displayName: 'Reply to Review',
  description:
    'Reply to a specific review within a date range for a selected application and collection',
  props: {
    collection_id: collection_idDropdown,
    app_ext_id: application_ext_idDropdown,
    fromDate: Property.DateTime({
      displayName: 'From Date',
      description: 'Start date for the reviews to reply to (eg. YYYY-MM-DD)',
      required: true,
    }),
    toDate: Property.DateTime({
      displayName: 'To Date',
      description: 'End date for the reviews to reply to (eg. YYYY-MM-DD)',
      required: false,
    }),
    review_id: review_ID_Dropdown,
    answer_text: Property.LongText({
      displayName: 'Answer Text',
      description: 'Text of the reply to the review',
      required: true,
    }),
  },
  async run(context) {
    const { app_ext_id, review_id, answer_text } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/reviews/reply`,
      {
        ext_id: app_ext_id,
        review_id,
        answer_text,
      }
    );

    return response;
  },
});
