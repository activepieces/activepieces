import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyDocument, McpSearchResult } from '../common/types';
import { SortingOrder, DocumentQuery, SortingQuery } from '@hcengineering/core';
import document, { Teamspace, Document } from '@hcengineering/document';

export const findDocument = createAction({
  auth: hulyAuth,
  name: 'find_document',
  displayName: 'Find Document',
  description: 'List documents in a teamspace by name with content fetching',
  props: {
    teamspace: Property.Dropdown({
      displayName: 'Teamspace',
      description: 'Teamspace to search documents in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const authConfig = auth as HulyAuthConfig;
          const client = await createHulyClient(authConfig);

          const teamspaces = await client.findAll(
            document.class.Teamspace,
            { archived: false },
            { sort: { name: SortingOrder.Ascending } }
          );

          await client.close();

          return {
            options: teamspaces.map((teamspace: Teamspace) => ({
              label: teamspace.name || 'Unnamed Teamspace',
              value: teamspace.name,
            })),
          };
        } catch (error) {
          return {
            options: [
              { label: 'Error loading teamspaces', value: 'error' }
            ],
          };
        }
      },
    }),
    titleSearch: Property.ShortText({
      displayName: 'Title Search',
      description: 'Document title or partial title to search for (optional)',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results',
      required: false,
      defaultValue: 'title',
      options: {
        options: [
          { label: 'Title (A-Z)', value: 'title' },
          { label: 'Modified Date (Latest First)', value: 'modifiedOn' },
          { label: 'Created Date (Latest First)', value: 'createdOn' },
        ],
      },
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Fetch document content as markdown',
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
      teamspace: teamspaceName,
      titleSearch,
      sortBy = 'title',
      includeContent = false,
      limit = 20
    } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      // Find teamspace by name first
      const teamspace = await client.findOne(
        document.class.Teamspace,
        {
          name: teamspaceName,
          archived: false,
        }
      );

      if (!teamspace) {
        await client.close();
        return {
          success: false,
          error: `Teamspace '${teamspaceName}' not found`,
        };
      }

      const query: DocumentQuery<Document> = {
        space: teamspace._id,
      };

      if (titleSearch) {
        query.title = { $regex: titleSearch, $options: 'i' };
      }

      const sortConfig: SortingQuery<Document> = {};
      switch (sortBy) {
        case 'title':
          sortConfig.title = SortingOrder.Ascending;
          break;
        case 'modifiedOn':
          sortConfig.modifiedOn = SortingOrder.Descending;
          break;
        case 'createdOn':
          sortConfig.createdOn = SortingOrder.Descending;
          break;
        default:
          sortConfig.title = SortingOrder.Ascending;
      }

      const results = await client.findAll(
        document.class.Document,
        query,
        {
          limit,
          sort: sortConfig
        }
      );

      const documents: HulyDocument[] = [];

      for (const doc of results) {
        let content = '';

        if (includeContent && doc.content) {
          try {
            content = await client.fetchMarkup(
              doc._class,
              doc._id,
              'content',
              doc.content,
              'markdown'
            );
          } catch (error) {
            console.warn(`Failed to fetch content for document ${doc._id}:`, error);
            content = '[Content unavailable]';
          }
        }

        documents.push({
          _id: doc._id,
          name: doc.title || 'Untitled Document',
          content: content,
          space: doc.space,
          teamspace: teamspaceName,
          modifiedOn: new Date(doc.modifiedOn || Date.now()),
        });
      }

      await client.close();

      const response: McpSearchResult<HulyDocument> = {
        items: documents,
        total: results.length,
        hasMore: results.length === limit,
      };

      const contentNote = includeContent ? ' with content' : '';
      return {
        success: true,
        data: response,
        message: `Found ${documents.length} documents in teamspace '${teamspaceName}'${contentNote}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
