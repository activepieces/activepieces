import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const aiExtractStructuredAction = createAction({
  auth: boxAuth,
  name: 'box_ai_extract_structured',
  displayName: 'Extract Structured with Box AI',
  description: 'Extracts typed fields from Box files with Box AI, using a metadata template or a field list.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Extracts typed key/value pairs from up to 25 Box files, defined either by a metadata template (Template Key + Scope, from List Enterprise Metadata Templates) or by a Fields list, exactly one of the two. It only returns values; save them with Create File Metadata. Uses the account\'s Box AI units.',
    idempotent: false,
  },
  props: {
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'IDs of the files to extract from (1-25). Get them from Search or List Folder Items.',
      required: true,
    }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: false,
      description: 'Key of the metadata template whose fields to extract, e.g. "invoiceTemplate". Give with Scope, not with Fields.',
    }),
    scope: boxAiProps.metadataScope({
      required: false,
      description: 'The template\'s scope: "enterprise", "enterprise_<id>" or "global". Required with Template Key.',
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Fields to extract instead of a template: [{"key": "total", "type": "float", "description": "Invoice total", "prompt": "..."}]. Types include string, float, date, enum and multiSelect (with "options": [{"key": "..."}]).',
      required: false,
    }),
    taxonomySources: Property.Json({
      displayName: 'Taxonomy Sources',
      description: 'Taxonomies for taxonomy fields, only with Fields: [{"type": "taxonomy", "taxonomy_key": "...", "namespace": "enterprise_123"}].',
      required: false,
    }),
    includeConfidenceScore: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Include Confidence Score',
      description: '"true" to return a confidence score for each field.',
    }),
    includeReference: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Include Reference',
      description: '"true" to return the quote each field was extracted from.',
    }),
    aiAgent: Property.Json({
      displayName: 'AI Agent',
      description: 'Agent override: {"type": "ai_agent_id", "id": "enhanced_extract_agent"} or an AI Studio agent ID from List AI Agents. Leave empty for the standard agent.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fileIds = propsValue.fileIds.map(String);
    if (fileIds.length === 0 || fileIds.length > 25) {
      throw new Error('File IDs must hold 1 to 25 IDs.');
    }
    const useTemplate = propsValue.templateKey !== undefined;
    if (useTemplate === (propsValue.fields !== undefined)) {
      throw new Error('Give exactly one of Template Key (with Scope) or Fields.');
    }
    if (useTemplate && propsValue.scope === undefined) {
      throw new Error('Scope is required with Template Key.');
    }
    if (useTemplate && propsValue.taxonomySources !== undefined) {
      throw new Error('Taxonomy Sources works only with Fields, not Template Key.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/ai/extract_structured',
      body: {
        items: fileIds.map((id) => ({ id, type: 'file' })),
        ...(useTemplate
          ? { metadata_template: { type: 'metadata_template', template_key: propsValue.templateKey, scope: propsValue.scope } }
          : { fields: propsValue.fields }),
        ...(propsValue.taxonomySources !== undefined ? { taxonomy_sources: propsValue.taxonomySources } : {}),
        ...(propsValue.includeConfidenceScore !== undefined
          ? { include_confidence_score: propsValue.includeConfidenceScore === 'true' }
          : {}),
        ...(propsValue.includeReference !== undefined ? { include_reference: propsValue.includeReference === 'true' } : {}),
        ...(propsValue.aiAgent !== undefined ? { ai_agent: propsValue.aiAgent } : {}),
      },
    });
  },
});
