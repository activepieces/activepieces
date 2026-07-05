import qs from 'qs';
import { createAction, Property } from '@activepieces/pieces-framework';
import { leverAuth } from '../..';
import { LEVER_BASE_URL } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const getOpportunity = createAction({
  name: 'getOpportunity',
  displayName: 'Get opportunity',
  description:
    "Retrieve a single opportunity, i.e. an individual's unique candidacy or journey for a given job position",
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch one Lever opportunity (a candidate's candidacy for a specific job) by its opportunity ID. Use to look up a known candidacy's details; an optional expand list pulls in related resources (e.g. applications, contact) in the same call. Read-only and idempotent; requires the opportunity ID.",
    idempotent: true,
  },
  auth: leverAuth,
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      required: true,
    }),
    expand: Property.Array({
      displayName: 'Expand',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${LEVER_BASE_URL}/opportunities/${
        propsValue.opportunityId
      }?${decodeURIComponent(
        qs.stringify({ expand: propsValue.expand }, { arrayFormat: 'repeat' })
      )}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.props.apiKey,
        password: '',
      },
    });
    return response.body.data;
  },
});
