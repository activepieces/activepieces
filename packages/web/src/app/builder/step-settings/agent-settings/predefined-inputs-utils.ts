import { FieldControlMode, PredefinedInputField } from '@activepieces/shared';

function withEditedField({
  fields,
  changedPath,
  values,
}: {
  fields: Record<string, PredefinedInputField>;
  changedPath: string;
  values: Record<string, unknown>;
}): Record<string, PredefinedInputField> {
  const propertyName = changedPath.split('.')[0];
  const field = fields[propertyName];
  if (field?.mode !== FieldControlMode.CHOOSE_YOURSELF) {
    return fields;
  }
  return {
    ...fields,
    [propertyName]: { ...field, value: values[propertyName] },
  };
}

export const predefinedInputsUtils = { withEditedField };
