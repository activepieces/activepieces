import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { listDocsActionOutputSchema } from '../../../output-schemas';

export const listDocsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_docs',
  classification: 'SEARCH',
  displayName: 'List Docs',
  description: 'Lists monday docs, optionally filtered by workspace or ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List monday.com docs (workdocs) with their internal doc ID, object ID, name, workspace and URL, optionally filtered by workspace IDs, doc IDs or object IDs (the ID in the doc URL). Use to resolve a doc ID for the other doc atomics; to find a doc by keyword use Search. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listDocsActionOutputSchema,
  props: {
    workspace_ids: Property.Array({
      displayName: 'Workspace IDs',
      description: 'Only return docs in these workspaces. Resolve them with List Workspaces.',
      required: false,
    }),
    doc_ids: Property.Array({
      displayName: 'Doc IDs',
      description: 'Only return these internal doc IDs.',
      required: false,
    }),
    object_ids: Property.Array({
      displayName: 'Object IDs',
      description: 'Only return docs with these object IDs (the ID that appears in the doc URL and in doc column values).',
      required: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: {
        options: [
          { label: 'Created at (newest first)', value: 'created_at' },
          { label: 'Last used', value: 'used_at' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of docs per page (default 25).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
  },
  async run(context) {
    const { order_by, limit, page } = context.propsValue;
    const workspaceIds = mondayApi.toStringArray(context.propsValue.workspace_ids);
    const docIds = mondayApi.toStringArray(context.propsValue.doc_ids);
    const objectIds = mondayApi.toStringArray(context.propsValue.object_ids);

    const data = await makeClient(context.auth).query<{ docs: MondayDoc[] | null }>({
      query: `query ($ids: [ID!], $object_ids: [ID!], $workspace_ids: [ID], $order_by: DocsOrderBy, $limit: Int, $page: Int) {
        docs(ids: $ids, object_ids: $object_ids, workspace_ids: $workspace_ids, order_by: $order_by, limit: $limit, page: $page) {
          id
          object_id
          name
          doc_kind
          url
          workspace_id
          doc_folder_id
          created_at
          updated_at
          created_by { id name }
        }
      }`,
      variables: {
        ids: docIds.length > 0 ? docIds : undefined,
        object_ids: objectIds.length > 0 ? objectIds : undefined,
        workspace_ids: workspaceIds.length > 0 ? workspaceIds : undefined,
        order_by: order_by ?? undefined,
        limit: limit ?? undefined,
        page: page ?? undefined,
      },
    });

    const docs = (data.docs ?? []).map((doc) => ({
      id: doc.id,
      object_id: doc.object_id,
      name: doc.name,
      doc_kind: doc.doc_kind,
      url: doc.url ?? null,
      workspace_id: doc.workspace_id ?? null,
      folder_id: doc.doc_folder_id ?? null,
      created_by_id: doc.created_by?.id ?? null,
      created_by_name: doc.created_by?.name ?? null,
      created_at: doc.created_at ?? null,
      updated_at: doc.updated_at ?? null,
    }));

    return { docs, count: docs.length };
  },
});

type MondayDoc = {
  id: string;
  object_id: string;
  name: string;
  doc_kind: string;
  url: string | null;
  workspace_id: string | null;
  doc_folder_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: { id: string; name: string } | null;
};
