import { assertNotNullOrUndefined } from "../../../common/helpers/assertions";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { custifyClient } from "../common/client";
import { custifyAuthentication } from "../common/props";

export const custifyAssignNpsAction = createAction({
  name: 'assign_nps',
  displayName: 'Assign NPS to people',
  description: 'Assign NPS to people',
  sampleData: {},

  props: {
    authentication: custifyAuthentication,
    email: Property.ShortText({
      displayName: 'email',
      required: true,
    }),
    score: Property.Number({
      displayName: 'score',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'comment',
      required: false,
    }),
    submittedAt: Property.ShortText({
      displayName: 'submittedAt',
      required: false,
    }),
  },

  async run({ propsValue }) {
    const { authentication: apiKey, email, score, comment, submittedAt } = propsValue;

    assertNotNullOrUndefined(apiKey, 'API Key');
    assertNotNullOrUndefined(email, 'email');
    assertNotNullOrUndefined(score, 'score');

    return await custifyClient.nps.assign({
      apiKey,
      email,
      score,
      comment,
      submittedAt,
    });
  }
});
