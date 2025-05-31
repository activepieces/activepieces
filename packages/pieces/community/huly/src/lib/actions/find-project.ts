import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyProject, McpSearchResult } from '../common/types';
import { SortingOrder, DocumentQuery, SortingQuery, FindOptions } from '@hcengineering/core';
import tracker, { Project } from '@hcengineering/tracker';
import task, { ProjectType } from '@hcengineering/task';

interface ProjectWithLookup extends Project {
  $lookup?: {
    type?: ProjectType;
  };
}

export const findProject = createAction({
  auth: hulyAuth,
  name: 'find_project',
  displayName: 'Find Project',
  description: 'Find projects with optional filtering and sorting capabilities',
  props: {
    searchMode: Property.StaticDropdown({
      displayName: 'Search Mode',
      description: 'How to search for projects',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'Find All Projects', value: 'all' },
          { label: 'Find by Identifier', value: 'identifier' },
          { label: 'Search by Name', value: 'name' },
        ],
      },
    }),
    identifier: Property.ShortText({
      displayName: 'Project Identifier',
      description: 'Project identifier to find (used when search mode is "identifier")',
      required: false,
    }),
    nameSearch: Property.ShortText({
      displayName: 'Name Search',
      description: 'Search projects by name (used when search mode is "name")',
      required: false,
    }),
    includeArchived: Property.Checkbox({
      displayName: 'Include Archived',
      description: 'Include archived projects in results',
      required: false,
      defaultValue: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results',
      required: false,
      defaultValue: 'name',
      options: {
        options: [
          { label: 'Name (A-Z)', value: 'name' },
          { label: 'Identifier (A-Z)', value: 'identifier' },
          { label: 'Modified Date (Latest First)', value: 'modifiedOn' },
          { label: 'Created Date (Latest First)', value: 'createdOn' },
        ],
      },
    }),
    includeProjectType: Property.Checkbox({
      displayName: 'Include Project Type',
      description: 'Fetch project type information with lookup',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 20, only applies to "all" and "name" modes)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const {
      searchMode = 'all',
      identifier,
      nameSearch,
      includeArchived = false,
      sortBy = 'name',
      includeProjectType = false,
      limit = 20
    } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Project> = {};

      switch (searchMode) {
        case 'identifier':
          if (!identifier) {
            return {
              success: false,
              error: 'Project identifier is required when search mode is "identifier"',
            };
          }
          query.identifier = identifier;
          break;
        case 'name':
          if (!nameSearch) {
            return {
              success: false,
              error: 'Name search is required when search mode is "name"',
            };
          }
          query.name = { $regex: nameSearch, $options: 'i' };
          break;
        case 'all':
          break;
      }

      if (!includeArchived) {
        query.archived = false;
      }

      const sortConfig: SortingQuery<Project> = {};
      switch (sortBy) {
        case 'name':
          sortConfig.name = SortingOrder.Ascending;
          break;
        case 'identifier':
          sortConfig.identifier = SortingOrder.Ascending;
          break;
        case 'modifiedOn':
          sortConfig.modifiedOn = SortingOrder.Descending;
          break;
        case 'createdOn':
          sortConfig.createdOn = SortingOrder.Descending;
          break;
        default:
          sortConfig.name = SortingOrder.Ascending;
      }

      // Configure lookup options for project type
      const findOptions: FindOptions<Project> = {
        sort: sortConfig
      };

      if (includeProjectType) {
        findOptions.lookup = {
          type: task.class.ProjectType
        };
      }

      if (searchMode === 'all' || searchMode === 'name') {
        findOptions.limit = limit;
      }

      let results: ProjectWithLookup[];

      if (searchMode === 'identifier') {
        const project = await client.findOne(
          tracker.class.Project,
          query,
          findOptions
        );
        results = project ? [project] : [];
      } else {
        results = await client.findAll(
          tracker.class.Project,
          query,
          findOptions
        );
      }

      const projects: HulyProject[] = results.map((project: ProjectWithLookup) => {
        let projectTypeInfo = '';

        if (includeProjectType && project.$lookup?.type) {
          const projectType = project.$lookup.type;
          projectTypeInfo = `Type: ${projectType.name || 'Unknown'}`;
          if (projectType.statuses && projectType.statuses.length > 0) {
            projectTypeInfo += `, Statuses: ${projectType.statuses.length}`;
          }
        }

        return {
          _id: project._id,
          name: project.name || 'Unknown',
          description: project.description || (projectTypeInfo ? projectTypeInfo : undefined),
          identifier: project.identifier,
          state: project.archived ? 'archived' : 'active',
        };
      });

      await client.close();

      if (searchMode === 'identifier') {
        if (projects.length === 0) {
          return {
            success: false,
            error: `Project with identifier '${identifier}' not found`,
          };
        }

        return {
          success: true,
          data: projects[0],
          message: `Found project: ${projects[0].name}`,
        };
      } else {
        const response: McpSearchResult<HulyProject> = {
          items: projects,
          total: results.length,
          hasMore: results.length === limit,
        };

        const typeNote = includeProjectType ? ' with type info' : '';
        const archivedNote = includeArchived ? ' (including archived)' : '';
        return {
          success: true,
          data: response,
          message: `Found ${projects.length} projects${typeNote}${archivedNote}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
