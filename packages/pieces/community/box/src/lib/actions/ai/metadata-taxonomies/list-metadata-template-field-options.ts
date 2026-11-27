import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListMetadataTemplateFieldOptionsOutputSchema } from '../../../output-schemas';

const BOOLEANS = ['true', 'false'];

export const listMetadataTemplateFieldOptionsAction = createAction({
  auth: boxAuth,
  name: 'box_list_metadata_template_field_options',
  outputSchema: boxListMetadataTemplateFieldOptionsOutputSchema,
  displayName: 'List Metadata Template Field Options',
  description: 'Lists the taxonomy nodes a taxonomy field of a metadata template accepts.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the taxonomy nodes that can be set on a template\'s taxonomy field, with their ids to use as field values in Create File Metadata. Only selectable nodes unless Only Selectable is "false". Page with Marker (next_marker). Template and field keys come from Get Metadata Template.',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({
      required: true,
      description: 'The template\'s enterprise namespace, "enterprise_<enterprise id>", e.g. "enterprise_123456".',
    }),
    templateKey: boxAiProps.metadataTemplateKey({ required: true }),
    fieldKey: Property.ShortText({
      displayName: 'Field Key',
      description: 'The key of a taxonomy field in the template, from Get Metadata Template.',
      required: true,
    }),
    level: Property.Number({
      displayName: 'Level',
      description: 'Only nodes on this level index, starting from 1.',
      required: false,
    }),
    parent: boxAiProps.taxonomyNodeId({
      required: false,
      displayName: 'Parent ID',
      description: 'Only direct children of this node id.',
    }),
    ancestor: boxAiProps.taxonomyNodeId({
      required: false,
      displayName: 'Ancestor ID',
      description: 'Only descendants of this node id, at any depth.',
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to search node names for.',
      required: false,
    }),
    onlySelectableOptions: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Only Selectable',
      description: '"false" also returns nodes the field does not allow selecting. Defaults to "true".',
    }),
    includeTotalResultCount: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Include Total Count',
      description: '"true" adds the total number of matching nodes, counted up to 10,000.',
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    for (const [label, value] of [
      ['Only Selectable', propsValue.onlySelectableOptions],
      ['Include Total Count', propsValue.includeTotalResultCount],
    ]) {
      if (value !== undefined && !BOOLEANS.includes(value)) {
        throw new Error(`${label} must be "true" or "false".`);
      }
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_templates/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.templateKey)}/fields/${encodeURIComponent(propsValue.fieldKey)}/options`,
      query: {
        level: boxUtils.optionalString({ value: propsValue.level }),
        parent: propsValue.parent,
        ancestor: propsValue.ancestor,
        query: propsValue.query,
        'only-selectable-options': propsValue.onlySelectableOptions,
        'include-total-result-count': propsValue.includeTotalResultCount,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
