import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyIssue, McpSearchResult } from '../common/types';
import { SortingOrder, DocumentQuery, SortingQuery } from '@hcengineering/core';
import tracker, { Issue, Project, IssuePriority } from '@hcengineering/tracker';

function priorityToString(priority: IssuePriority | undefined): 'low' | 'medium' | 'high' | 'urgent' {
  switch (priority) {
    case IssuePriority.Low:
      return 'low';
    case IssuePriority.Medium:
      return 'medium';
    case IssuePriority.High:
      return 'high';
    case IssuePriority.Urgent:
      return 'urgent';
    default:
      return 'medium';
  }
}

export const findIssue = createAction({
  auth: hulyAuth,
  name: 'find_issue',
  displayName: 'Find Issue',
  description: 'List issues in a project with optional content fetching and filtering',
  props: {
    project: Property.Dropdown({
      displayName: 'Project',
      description: 'Project to search for issues in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const authConfig = auth as HulyAuthConfig;
          const client = await createHulyClient(authConfig);

          const projects = await client.findAll(
            tracker.class.Project,
            { archived: false },
            { sort: { name: SortingOrder.Ascending } }
          );

          await client.close();

          return {
            options: projects.map((project: Project) => ({
              label: `${project.name} (${project.identifier})`,
              value: project.identifier,
            })),
          };
        } catch (error) {
          return {
            options: [
              { label: 'Error loading projects', value: 'error' }
            ],
          };
        }
      },
    }),
    titleSearch: Property.ShortText({
      displayName: 'Title Search',
      description: 'Search issues by title (optional)',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results',
      required: false,
      defaultValue: 'modifiedOn',
      options: {
        options: [
          { label: 'Modified Date (Latest First)', value: 'modifiedOn' },
          { label: 'Title (A-Z)', value: 'title' },
          { label: 'Priority (High to Low)', value: 'priority' },
          { label: 'Issue Number', value: 'number' },
        ],
      },
    }),
    includeDescription: Property.Checkbox({
      displayName: 'Include Description',
      description: 'Fetch issue descriptions as markdown',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const {
      project: projectIdentifier,
      titleSearch,
      sortBy = 'modifiedOn',
      includeDescription = false,
      limit = 20
    } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const project = await client.findOne(
        tracker.class.Project,
        { identifier: projectIdentifier }
      );

      if (!project) {
        await client.close();
        return {
          success: false,
          error: `Project with identifier '${projectIdentifier}' not found`,
        };
      }

      const query: DocumentQuery<Issue> = {
        space: project._id,
      };

      if (titleSearch) {
        query.title = { $regex: titleSearch, $options: 'i' };
      }

      const sortConfig: SortingQuery<Issue> = {};
      switch (sortBy) {
        case 'modifiedOn':
          sortConfig.modifiedOn = SortingOrder.Descending;
          break;
        case 'title':
          sortConfig.title = SortingOrder.Ascending;
          break;
        case 'priority':
          sortConfig.priority = SortingOrder.Descending;
          break;
        case 'number':
          sortConfig.number = SortingOrder.Ascending;
          break;
        default:
          sortConfig.modifiedOn = SortingOrder.Descending;
      }

      const results = await client.findAll(
        tracker.class.Issue,
        query,
        {
          limit,
          sort: sortConfig
        }
      );

      const issues: HulyIssue[] = [];

      for (const issue of results) {
        let description = '';

        if (includeDescription && issue.description) {
          try {
            description = await client.fetchMarkup(
              issue._class,
              issue._id,
              'description',
              issue.description,
              'markdown'
            );
          } catch (error) {
            console.warn(`Failed to fetch description for issue ${issue._id}:`, error);
            description = '[Description unavailable]';
          }
        }

        issues.push({
          _id: issue._id,
          title: issue.title || 'Untitled',
          description: description,
          number: issue.number || 0,
          priority: priorityToString(issue.priority),
          status: issue.status?.toString() || 'Open',
          assignee: issue.assignee?.toString(),
          dueDate: issue.dueDate ? new Date(issue.dueDate) : undefined,
          project: projectIdentifier,
          modifiedOn: new Date(issue.modifiedOn || Date.now()),
        });
      }

      await client.close();

      const response: McpSearchResult<HulyIssue> = {
        items: issues,
        total: results.length,
        hasMore: results.length === limit,
      };

      const contentNote = includeDescription ? ' with descriptions' : '';
      return {
        success: true,
        data: response,
        message: `Found ${issues.length} issues in project '${projectIdentifier}'${contentNote}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
