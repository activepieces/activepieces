import { Property, createAction } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { searchIssuesByJql } from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const searchIssues = createAction({
  name: 'search_issues',
  displayName: 'Search Issues',
  description: 'Search for issues with JQL (supports pagination and field selection)',
  auth: jiraCloudAuth,
  props: {
    jql: Property.LongText({
      displayName: 'JQL',
      description: "The JQL query (Tip: Use single quotes for strings/dates)",
      defaultValue: `type = story and created > '2023-12-13 14:00'`,
      required: true,
    }),
    fields: Property.ShortText({
      displayName: 'Fields to Return',
      description: 'Comma-separated fields to return (e.g., summary,status). Leave blank to return all fields.',
      required: false,
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
      maxResults: z.number().min(1).max(5000),
    });

    const { jql, maxResults, sanitizeJql, fields } = propsValue;
    const fieldList = fields ? fields.split(',').map((f) => f.trim()) : undefined;

    const allIssues: any[] = [];
    let nextPageToken: string | undefined;
    const PAGE_SIZE = 50;

    while (allIssues.length < maxResults) {
      const limit = Math.min(PAGE_SIZE, maxResults - allIssues.length);

      const response = await searchIssuesByJql({
        auth,
        jql,
        maxResults: limit,
        sanitizeJql,
        nextPageToken,
        fields: fieldList,
      });

      allIssues.push(...response);
      nextPageToken = response.nextPageToken;

      if (!nextPageToken || response.length === 0) break;
    }

    return allIssues;
  },
});