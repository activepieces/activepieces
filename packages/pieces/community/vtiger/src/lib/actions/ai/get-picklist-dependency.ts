import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { moduleProp } from '../../ai-common';
import { picklistDependencySchema } from '../../output-schemas';
import { fetchPicklistDependency, isRecord } from '../../rest-client';
import { assertFieldName, assertModuleName } from '../../vtql';

export function toMappings(result: unknown): { sourceValue: string; targetValues: string[] }[] {
  const rows = isRecord(result) && Array.isArray(result['valuemapping']) ? result['valuemapping'] : [];
  return rows.filter(isRecord).map((row) => ({
    sourceValue: String(row['sourcevalue'] ?? ''),
    targetValues: Array.isArray(row['targetvalues']) ? row['targetvalues'].map((v) => String(v)) : [],
  }));
}

export const getPicklistDependencyAction = createAction({
  auth: vtigerAuth,
  name: 'get_picklist_dependency',
  displayName: 'Get Picklist Dependency',
  description: 'Returns which target picklist values are allowed for each source picklist value.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the picklist dependency between two picklist fields of a module: for each source value, the target values Vtiger allows. Use it before setting dependent picklists so the update is accepted. hasDependency is false and mappings is empty when no dependency is configured for the pair.',
    idempotent: true,
  },
  outputSchema: picklistDependencySchema,
  props: {
    module: moduleProp(),
    sourceField: Property.ShortText({
      displayName: 'Source Field',
      description: 'API name of the controlling picklist field (from Describe Module).',
      required: true,
    }),
    targetField: Property.ShortText({
      displayName: 'Target Field',
      description: 'API name of the dependent picklist field (from Describe Module).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const module = assertModuleName(propsValue.module);
    const sourceField = assertFieldName(propsValue.sourceField);
    const targetField = assertFieldName(propsValue.targetField);
    const dependency = await fetchPicklistDependency({ creds: auth.props, module, sourceField, targetField });
    const mappings = toMappings(dependency);
    return { module, sourceField, targetField, hasDependency: mappings.length > 0, mappings };
  },
});
