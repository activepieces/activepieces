import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { moduleProp } from '../../ai-common';
import { describeModuleSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertModuleName } from '../../vtql';

export function shapeDescribe(result: unknown) {
  const value = isRecord(result) ? result : {};
  const fields = Array.isArray(value['fields']) ? value['fields'].filter(isRecord) : [];
  const shaped = fields.map((field) => {
    const type = isRecord(field['type']) ? field['type'] : {};
    const picklist = Array.isArray(type['picklistValues']) ? type['picklistValues'].filter(isRecord) : [];
    return {
      name: textOf(field['name']),
      label: textOf(field['label']),
      type: textOf(type['name']),
      mandatory: field['mandatory'] === true,
      editable: field['editable'] !== false,
      picklistValues: picklist.map((p) => textOf(p['value'])),
      refersTo: Array.isArray(type['refersTo']) ? type['refersTo'].map(textOf) : [],
    };
  });
  return {
    name: textOf(value['name']),
    label: textOf(value['label']),
    idPrefix: textOf(value['idPrefix']),
    createable: value['createable'] === true,
    updateable: value['updateable'] === true,
    deleteable: value['deleteable'] === true,
    labelFields: textOf(value['labelFields']),
    fields: shaped,
    fieldCount: shaped.length,
  };
}

function textOf(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(textOf).join(',');
  }
  return typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

export const describeModuleAction = createAction({
  auth: vtigerAuth,
  name: 'describe_module',
  displayName: 'Describe Module',
  description: 'Lists the fields of a Vtiger module with their types and allowed values.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the fields of one Vtiger module: API name, label, type, whether it is mandatory, picklist values and the modules a reference field points to. Call it before creating, updating or filtering records so you use real field names (e.g. lastname, cf_853) and valid picklist values.',
    idempotent: true,
  },
  outputSchema: describeModuleSchema,
  props: {
    module: moduleProp(),
  },
  async run({ auth, propsValue }) {
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'describe',
      query: { elementType: assertModuleName(propsValue.module) },
    });
    return shapeDescribe(result);
  },
});
