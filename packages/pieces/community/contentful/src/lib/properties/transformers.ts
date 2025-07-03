import {
  ArrayProperty,
  BasePropertySchema,
  CheckboxProperty,
  DateTimeProperty,
  DropdownOption,
  LongTextProperty,
  NumberProperty,
  ObjectProperty,
  Property,
  ShortTextProperty,
} from '@activepieces/pieces-framework';
import { ContentFields, FieldType } from 'contentful-management';
import { getLinkHelperText } from '../common';

type Properties<T> = Omit<
  T,
  | 'valueSchema'
  | 'type'
  | 'defaultValidators'
  | 'defaultProcessors'
  | 'required'
  | 'displayName'
>;

const evalAndConvertToStaticDropDown = <T extends string | number>(
  field: ContentFields
) => {
  const options: DropdownOption<T>[] = [];
  if (field.validations) {
    field.validations.forEach((v) => {
      if (v['in']) {
        options.push(
          ...v['in'].map((o) => ({ label: o.toString(), value: o as T }))
        );
      }
    });
  }
  if (options.length > 0) {
    return Property.StaticDropdown<T>({
      displayName: field.name,
      required: field.required,
      options: {
        disabled: false,
        placeholder: 'Select an option',
        options,
      },
    });
  }
  return null;
};

const ShortTextTransformer =
  (request: Properties<ShortTextProperty<true>> = {}) =>
  (field: ContentFields) => {
    const isDropdown = evalAndConvertToStaticDropDown<string>(field);
    if (isDropdown) return isDropdown;

    return Property.ShortText({
      ...request,
      displayName: field.name,
      required: field.required,
    });
  };

const LongTextTransformer =
  (request: Properties<LongTextProperty<true>> = {}) =>
  (field: ContentFields) =>
    Property.LongText({
      ...request,
      displayName: field.name,
      required: field.required,
    });

const NumberTransformer =
  (request: Properties<NumberProperty<true>> = {}) =>
  (field: ContentFields) => {
    const isDrowdown = evalAndConvertToStaticDropDown<number>(field);
    if (isDrowdown) return isDrowdown;

    return Property.Number({
      ...request,
      displayName: field.name,
      required: field.required,
    });
  };

const DateTimeTransformer =
  (request: Properties<DateTimeProperty<true>> = {}) =>
  (field: ContentFields) => {
    return Property.DateTime({
      ...request,
      displayName: field.name,
      required: field.required,
    });
  };

const CheckboxTransformer =
  (request: Properties<CheckboxProperty<true>> = {}) =>
  (field: ContentFields) =>
    Property.Checkbox({
      ...request,
      displayName: field.name,
      required: field.required,
    });

const ObjectTransformer =
  (request: Properties<ObjectProperty<true>> = {}) =>
  (field: ContentFields) =>
    Property.Object({
      ...request,
      displayName: field.name,
      required: field.required,
    });

const LinkTransformer =
  (request: Properties<ShortTextProperty<true>> = {}) =>
  (field: ContentFields) => {
    const prefix = field.linkType || field.type || '';
    const helperText = getLinkHelperText(field.validations);

    return ShortTextTransformer({
      ...request,
      description: `${prefix}: ${helperText || 'Any'}`,
    })(field);
  };

const ArrayTransformer =
  (request: Properties<ArrayProperty<true>> = {}) =>
  (field: ContentFields) => {
    const prefix = field.items?.linkType || field.items?.type || '';
    const helperText = getLinkHelperText(field.items?.validations);

    return Property.Array({
      ...request,
      displayName: field.name,
      required: field.required,
      description: `${prefix}: ${helperText || 'Any'}`,
    });
  };

type Transformer = (field: ContentFields) => BasePropertySchema | null;

export const FieldTransformers: Record<FieldType['type'], Transformer> = {
  Symbol: ShortTextTransformer({}),
  Text: LongTextTransformer({}),
  RichText: LongTextTransformer(),
  Integer: NumberTransformer({}),
  Number: NumberTransformer(),
  Date: DateTimeTransformer(),
  Boolean: CheckboxTransformer(),
  Object: ObjectTransformer(),
  Location: ObjectTransformer(),
  Link: LinkTransformer(),
  ResourceLink: LinkTransformer(),
  Array: ArrayTransformer(),
};
