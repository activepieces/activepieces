import {
  Property,
  Validators,
  createAction,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { searchIssuesByJql } from '../common';

export const searchIssues = createAction({
  name: 'search_issues',
  displayName: 'Search Issues',
  description: 'Search for issues with JQL',
  auth: jiraCloudAuth,
  props: {
    jql: Property.LongText({
      displayName: 'JQL',
      description: 'The JQL query to use in the search',
      defaultValue: `type = story and created > '2023-12-13 14:00'`,
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      defaultValue: 50,
      required: true,
      validators: [
        Validators.number,
        Validators.minValue(1),
        Validators.maxValue(100),
      ],
    }),
    sanitizeJql: Property.Checkbox({
      displayName: 'Sanitize JQL',
      required: true,
      defaultValue: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const { jql, maxResults, sanitizeJql } = propsValue;
    return await searchIssuesByJql({
      auth,
      jql,
      maxResults: maxResults,
      sanitizeJql,
    });
  },
});
