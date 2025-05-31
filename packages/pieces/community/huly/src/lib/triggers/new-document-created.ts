import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyDocument } from '../common/types';
import { SortingOrder, DocumentQuery, Timestamp, Ref } from '@hcengineering/core';
import document, { Document, Teamspace } from '@hcengineering/document';

interface DocumentWithSuggestion extends HulyDocument {
  suggestion: string;
}

export const newDocumentCreated = createTrigger({
  auth: hulyAuth,
  name: 'new_document_created',
  displayName: 'New Document Created',
  description: 'Triggers when a new document is created in a Huly teamspace',
  props: {
    teamspace: Property.Dropdown({
      displayName: 'Teamspace',
      description: 'Teamspace to monitor for new documents (leave empty to monitor all teamspaces)',
      required: false,
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

          const options = teamspaces.map((teamspace: Teamspace) => ({
            label: teamspace.name || 'Unnamed Teamspace',
            value: String(teamspace._id),
          }));

          options.unshift({ label: 'All Teamspaces', value: '' });

          return { options };
        } catch (error) {
          return {
            options: [
              { label: 'All Teamspaces', value: '' },
              { label: 'Error loading teamspaces', value: 'error' }
            ],
          };
        }
      },
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Document Content',
      description: 'Fetch document content as markdown (may impact performance)',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    _id: 'document_123',
    name: 'Sample Document',
    content: 'This is a sample document content in markdown format',
    space: 'space_123',
    teamspace: 'sample-teamspace',
    modifiedOn: new Date(),
    suggestion: 'Consider adding a summary or linking this document to a project for better organization and discoverability.',
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const lastCheckTime = await context.store.get('lastCheckTime');
    if (!lastCheckTime) {
      await context.store.put('lastCheckTime', Date.now());
    }
  },

  async onDisable(context) {
    await context.store.delete('lastCheckTime');
  },

  async test(context) {
    const auth = context.auth as HulyAuthConfig;
    const { teamspace, includeContent = false } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Document> = {};

      if (teamspace) {
        query.space = teamspace as Ref<Teamspace>;
      }

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: sevenDaysAgo as Timestamp };

      const results = await client.findAll(
        document.class.Document,
        query,
        {
          limit: 5,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const documents: DocumentWithSuggestion[] = [];

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

        let teamspaceName = 'Unknown';
        if (doc.space) {
          try {
            const teamspaceDoc = await client.findOne(document.class.Teamspace, { _id: doc.space });
            teamspaceName = teamspaceDoc?.name || 'Unknown';
          } catch (error) {
            console.error('Error in newDocumentCreated test:', error);
          }
        }

        documents.push({
          _id: doc._id,
          name: doc.title || 'Untitled Document',
          content: content,
          space: doc.space,
          teamspace: teamspaceName,
          modifiedOn: new Date(doc.modifiedOn || Date.now()),
          suggestion: 'Consider adding a summary or linking this document to a project for better organization and discoverability.',
        });
      }

      await client.close();

      return documents.length > 0 ? documents : [
        {
          _id: 'document_test',
          name: 'Test Document',
          content: 'This is a test document for trigger testing',
          space: 'test_space',
          teamspace: 'Test Teamspace',
          modifiedOn: new Date(),
          suggestion: 'Consider adding a summary or linking this document to a project for better organization and discoverability.',
        }
      ];
    } catch (error) {
      console.error('Error in newDocumentCreated test:', error);
      return [
        {
          _id: 'document_sample',
          name: 'Sample Document',
          content: 'This is a sample document for testing',
          space: 'sample_space',
          teamspace: 'Sample Teamspace',
          modifiedOn: new Date(),
          suggestion: 'Consider adding a summary or linking this document to a project for better organization and discoverability.',
        }
      ];
    }
  },

  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const { teamspace, includeContent = false } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Document> = {};

      if (teamspace) {
        query.space = teamspace as Ref<Teamspace>;
      }

      const lastCheckTime = await context.store.get('lastCheckTime') || Date.now() - (24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: lastCheckTime as Timestamp };

      const results = await client.findAll(
        document.class.Document,
        query,
        {
          limit: 50,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const documents: DocumentWithSuggestion[] = [];

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

        let teamspaceName = 'Unknown';
        if (doc.space) {
          try {
            const teamspaceDoc = await client.findOne(document.class.Teamspace, { _id: doc.space });
            teamspaceName = teamspaceDoc?.name || 'Unknown';
          } catch (error) {
            console.error('Error in newDocumentCreated trigger:', error);
          }
        }

        documents.push({
          _id: doc._id,
          name: doc.title || 'Untitled Document',
          content: content,
          space: doc.space,
          teamspace: teamspaceName,
          modifiedOn: new Date(doc.modifiedOn || Date.now()),
          suggestion: 'Consider adding a summary or linking this document to a project for better organization and discoverability.',
        });
      }

      await client.close();

      await context.store.put('lastCheckTime', Date.now());

      return documents;
    } catch (error) {
      console.error('Error in newDocumentCreated trigger:', error);
      return [];
    }
  },
});
