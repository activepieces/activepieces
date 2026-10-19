import { Property, createAction } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { searchIssuesByJql, mapFieldNames } from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

import { issueListOutputSchema } from '../output-schemas';
export const searchIssues = createAction({
  name: 'search_issues',
  classification: 'SEARCH',
  displayName: 'Search Issues',
  description: 'Finds issues that match a JQL query.',
  audience: 'human',
  aiMetadata: {
    description:
      'Search Jira issues with an arbitrary JQL query, paginating automatically up to a max-results cap (1-5000) and optionally restricting which fields are returned or mapping field IDs to readable names. The go-to tool for finding issues by project, status, assignee, dates, or any JQL-expressible criteria; limit returned fields on large result sets to avoid memory issues. Read-only and idempotent.',
    idempotent: true,
  },
  auth: jiraCloudAuth,
  outputSchema: issueListOutputSchema,
  propertyGroups: [
    {
      key: 'query',
      display: 'section',
      label: 'Query',
      icon: 'filter',
      props: ['jql', 'memoryWarning', 'fields', 'sanitizeJql'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['maxResults', 'mapNames'],
    },
  ],
  props: {
    memoryWarning: Property.MarkDown({
      value: "Returning every field of many issues can exceed your flow's memory. List only the fields you need.",
      variant: MarkdownVariant.WARNING,
    }),
    jql: Property.LongText({
      displayName: 'JQL',
      description: 'Put text and dates in single quotes.',
      defaultValue: `type = story and created > '2023-12-13 14:00'`,
      required: true,
    }),
    fields: Property.Array({
      displayName: 'Fields to Return',
      description: 'Field IDs, e.g. summary. Use *all for every field.',
      required: false,
    }),
    mapNames: Property.Checkbox({
      displayName: 'Map Field Names',
      description: 'Key fields by their name instead of their ID.',
      required: false,
      defaultValue: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Most issues to return, up to 5,000.',
      display: 'stepper',
      min: 1,
      max: 5000,
      step: 1,
      defaultValue: 50,
      required: true,
    }),
    sanitizeJql: Property.Checkbox({
      displayName: 'Sanitize JQL',
      description: "Jira swaps names you can't view for IDs before the search runs.",
      required: false,
      defaultValue: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    await propsValidation.validateZod(propsValue, {
      maxResults: z.number().check(z.minimum(1), z.maximum(5000)),
    });

    const { jql, maxResults, sanitizeJql, fields, mapNames } = propsValue;
    
    const fieldList = fields as string[];

    const expandParams = mapNames ? ['names'] : [];

    const allIssues: any[] = [];
    let nextPageToken: string | undefined;
    const PAGE_SIZE = 100; 

    while (allIssues.length < maxResults) {
      const limit = Math.min(PAGE_SIZE, maxResults - allIssues.length);

      const response = await searchIssuesByJql({
        auth,
        jql,
        maxResults: limit,
        sanitizeJql: sanitizeJql ?? true,
        nextPageToken,
        fields: fieldList,
        expand: expandParams,
      });

      const fetchedIssues = response.issues;
      const fieldNames = response.names || {};
      
      if (mapNames && Object.keys(fieldNames).length > 0) {
        for (const issue of fetchedIssues) {
          if (issue.fields) {
            issue.fields = mapFieldNames(issue.fields, fieldNames);
          }
        }
      }

      allIssues.push(...fetchedIssues);
      nextPageToken = response.nextPageToken;

      if (!nextPageToken || fetchedIssues.length === 0) break;
    }

    return allIssues;
  },
});