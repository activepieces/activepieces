import { createAction, Property } from '@activepieces/pieces-framework';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchForAnIssueOccurrence = createAction({
  auth: intruderAuth,
  name: 'searchForAnIssueOccurrence',
  displayName: 'Search For an Issue Occurrence',
  description:
    'Search for occurrences of an issue by ID with optional snoozed filter',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the individual occurrences of a specific Intruder issue, identified by its issue ID, with an optional filter for snoozed occurrences. Use when an agent needs to see where and how a known issue manifests across targets. Requires the issue ID. Idempotent: a read-only lookup that does not modify any data.',
    idempotent: true,
  },
  props: {
    issueId: Property.ShortText({
      displayName: 'Issue ID',
      description: 'The ID of the issue to search for occurrences',
      required: true,
    }),
    snoozed: Property.Checkbox({
      displayName: 'Snoozed',
      description: 'Filter for snoozed occurrences',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    let url = `/issues/${encodeURIComponent(propsValue.issueId)}/occurrences/`;

    if (propsValue.snoozed !== undefined && propsValue.snoozed !== null) {
      url += `?snoozed=${propsValue.snoozed}`;
    }

    const response = await makeRequest(auth.secret_text, HttpMethod.GET, url);

    return response;
  },
});
