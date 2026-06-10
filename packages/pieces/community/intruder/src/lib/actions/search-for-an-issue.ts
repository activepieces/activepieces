import { createAction, Property } from '@activepieces/pieces-framework';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchForAnIssue = createAction({
  auth: intruderAuth,
  name: 'searchForAnIssue',
  displayName: 'Search For an Issue',
  description: 'Search for issues with optional filters',
  props: {
    issueIds: Property.Array({
      displayName: 'Issue IDs',
      description: 'Filter by specific issue IDs',
      required: false,
    }),
    targetAddresses: Property.Array({
      displayName: 'Target Addresses',
      description: 'Filter by target addresses (e.g., example.com, 192.168.1.1)',
      required: false,
    }),
    tagNames: Property.Array({
      displayName: 'Tag Names',
      description: 'Filter by tag names',
      required: false,
    }),
    severity: Property.StaticDropdown({
      displayName: 'Severity',
      description: 'Filter by severity level',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' },
        ],
      },
    }),
    snoozed: Property.Checkbox({
      displayName: 'Snoozed',
      description: 'Filter for snoozed issues',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const params = new URLSearchParams();

    if (propsValue.issueIds && propsValue.issueIds.length > 0) {
      propsValue.issueIds.forEach((id) => {
        params.append('issue_ids', String(id));
      });
    }

    if (propsValue.targetAddresses && propsValue.targetAddresses.length > 0) {
      propsValue.targetAddresses.forEach((address) => {
        params.append('target_addresses', String(address));
      });
    }

    if (propsValue.tagNames && propsValue.tagNames.length > 0) {
      propsValue.tagNames.forEach((tag) => {
        params.append('tag_names', String(tag));
      });
    }

    if (propsValue.severity) {
      params.append('severity', propsValue.severity);
    }

    if (propsValue.snoozed !== undefined && propsValue.snoozed !== null) {
      params.append('snoozed', String(propsValue.snoozed));
    }

    const queryString = params.toString();
    const url = `/issues/${queryString ? '?' + queryString : ''}`;

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      url
    );

    return response;
  },
});
