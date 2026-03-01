interface BaseField {
  name: string;
  displayName: string;
  description?: string;
  isRequired: boolean;
}

interface TextField extends BaseField {
  type: 'text';
}

interface MultiTextField extends BaseField {
  type: 'multi_text';
}

interface NumberField extends BaseField {
  type: 'number';
}
interface BooleanField extends BaseField {
  type: 'boolean';
}

interface DateField extends BaseField {
  type: 'date';
}

interface StaticSelectField extends BaseField {
  type: 'static_select';
  options: Array<{ label: string; value: string }>;
}

interface StaticMultiSelectField extends BaseField {
  type: 'static_multi_select';
  options: Array<{ label: string; value: string }>;
}

interface DynamicSingleSelectField extends BaseField {
  type: 'dynamic_select';
  options: {
    sourceFieldSlug: string;
    labelField: string;
  };
}

interface DynamicMultiSelectField extends BaseField {
  type: 'dynamic_multi_select';
  options: {
    sourceFieldSlug: string;
    labelField: string;
  };
}

export type EntityProp =
  | TextField
  | MultiTextField
  | NumberField
  | BooleanField
  | DateField
  | StaticMultiSelectField
  | StaticSelectField
  | DynamicMultiSelectField
  | DynamicSingleSelectField;
