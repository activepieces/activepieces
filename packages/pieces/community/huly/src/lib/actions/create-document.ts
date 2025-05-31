import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { McpCreateResult } from '../common/types';
import { Ref, SortingOrder, generateId } from '@hcengineering/core';
import document, { Document, Teamspace } from '@hcengineering/document';
import { makeRank } from '@hcengineering/rank';

export const createDocument = createAction({
  auth: hulyAuth,
  name: 'create_document',
  displayName: 'Create Document',
  description: 'Create a document with Markdown content inside a teamspace',
  props: {
    teamspace: Property.Dropdown({
      displayName: 'Teamspace',
      description: 'Teamspace to create the document in',
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
    title: Property.ShortText({
      displayName: 'Document Title',
      description: 'Title of the document',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Markdown content of the document',
      required: false,
      defaultValue: '# New Document\n\nWrite your content here...',
    }),
  },
  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const { teamspace: teamspaceName, title, content = '' } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

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

      const lastDocument = await client.findOne<Document>(
        document.class.Document,
        { space: teamspace._id },
        { sort: { rank: SortingOrder.Descending } }
      );

      const documentId: Ref<Document> = generateId();

      const uploadedContent = await client.uploadMarkup(
        document.class.Document,
        documentId,
        'content',
        content,
        'markdown'
      );

      await client.createDoc(
        document.class.Document,
        teamspace._id,
        {
          title,
          content: uploadedContent,
          parent: document.ids.NoParent,
          rank: makeRank(lastDocument?.rank, undefined),
        },
        documentId
      );

      await client.close();

      const result: McpCreateResult = {
        _id: documentId as string,
        success: true,
        message: `Document '${title}' created successfully in teamspace '${teamspaceName}'`,
      };

      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
