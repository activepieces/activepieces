import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxQueryMetadataOutputSchema } from '../../../output-schemas';

export const queryMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_query_metadata',
  outputSchema: boxQueryMetadataOutputSchema,
  displayName: 'Query Metadata',
  description: 'Finds Box files and folders by their metadata values.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of files and folders whose values for one metadata template match a SQL-like query, e.g. "amount >= :minAmount". Results appear right after metadata changes, unlike Search. Page with Marker (next_marker). Template scope and key come from List Enterprise Metadata Templates.',
    idempotent: true,
  },
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'The template to query, as "<scope>.<templateKey>", e.g. "enterprise_123456.contractTemplate". Classification templates can\'t be queried.',
      required: true,
    }),
    ancestorFolderId: boxAiProps.folderId({
      required: true,
      displayName: 'Ancestor Folder ID',
      description: 'Only items in this folder and its subfolders. "0" searches every folder the user can access.',
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'SQL-like condition on template fields, with :name placeholders filled from Query Params, e.g. "status = :status AND amount >= :minAmount". Leave empty to match every item with the template.',
      required: false,
    }),
    queryParams: Property.Json({
      displayName: 'Query Params',
      description: 'Values for the :name placeholders in Query, typed like the template fields, e.g. {"status": "active", "minAmount": 100}.',
      required: false,
    }),
    orderBy: Property.Json({
      displayName: 'Order By',
      description: 'JSON array of {"field_key", "direction"} with direction "ASC" or "DESC", the same for every entry, e.g. [{"field_key": "amount", "direction": "DESC"}].',
      required: false,
    }),
    fields: Property.ShortText({
      displayName: 'Fields',
      description: 'Comma-separated fields to add to each item, including metadata, e.g. "name,metadata.enterprise_123456.contractTemplate.amount". By default only basic info is returned.',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false, description: 'Max items to return (1-100). Defaults to 100.' }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.orderBy !== undefined && !Array.isArray(propsValue.orderBy)) {
      throw new Error('Order By must be a JSON array of {"field_key", "direction"} objects.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/metadata_queries/execute_read',
      body: {
        from: propsValue.from,
        ancestor_folder_id: propsValue.ancestorFolderId,
        limit: Number(boxUtils.limitParam({ limit: propsValue.limit, max: 100, fallback: 100 })),
        ...(propsValue.query !== undefined ? { query: propsValue.query } : {}),
        ...(propsValue.queryParams !== undefined ? { query_params: propsValue.queryParams } : {}),
        ...(propsValue.orderBy !== undefined ? { order_by: propsValue.orderBy } : {}),
        ...(propsValue.fields !== undefined ? { fields: propsValue.fields.split(',').map((field) => field.trim()) } : {}),
        ...(propsValue.marker !== undefined ? { marker: propsValue.marker } : {}),
      },
    });
  },
});
