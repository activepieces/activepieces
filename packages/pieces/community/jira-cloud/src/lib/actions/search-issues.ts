import { Property, createAction } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { jiraCloudAuth } from '../../auth';
import { searchIssuesByJql, mapFieldNames } from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const searchIssues = createAction({
  name: 'search_issues',
  displayName: 'Search Issues',
  description: 'Search for issues with JQL',
  auth: jiraCloudAuth,
  props: {
    memoryWarning: Property.MarkDown({
      value: `Fetching a large number of issues without specifying **Fields to Return** may exceed your flow's memory limits. Use field selection to reduce payload size.`,
      variant: MarkdownVariant.WARNING,
    }),
    jql: Property.LongText({
      displayName: 'JQL',
      description: "The JQL query to use in search (Tip: Use single quotes for strings/dates)",
      defaultValue: `type = story and created > '2023-12-13 14:00'`,
      required: true,
    }),
    fields: Property.Array({
      displayName: 'Fields to Return',
      description: `List of exact Jira Field IDs to return (e.g., 'summary', 'customfield_10016').
Special commands:
- Use *all for every field.
- Use *navigable for standard fields (default).
- Prefix with a minus to exclude (e.g., -description).
Example: *all and -comment returns everything except comments.`,
      required: false,
    }),
    mapNames: Property.Checkbox({
      displayName: 'Map Field Names',
      description: `Map human readable names to Fields in the output.\nNotes:\n- If there are fields with the same name, they may be overridden.`,
      required: true,
      defaultValue: false,
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
        sanitizeJql,
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