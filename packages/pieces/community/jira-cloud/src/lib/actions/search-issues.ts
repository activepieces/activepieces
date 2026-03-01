import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { searchIssuesByJql } from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

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
    }),
    sanitizeJql: Property.Checkbox({
      displayName: 'Sanitize JQL',
      required: true,
      defaultValue: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    await propsValidation.validateZod(propsValue, {
      maxResults: z.number().min(1).max(100),
    });
    const { jql, maxResults, sanitizeJql } = propsValue;
    return await searchIssuesByJql({
      auth,
      jql,
      maxResults: maxResults,
      sanitizeJql,
    });
  },
});
