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
  Validators,
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
// Converts a Contentful Symbol into a Short Text Property with
// validations applied from the contentful model
const ShortTextTransformer =
  (request: Properties<ShortTextProperty<true>> = {}) =>
  (field: ContentFields) => {
    const isDropdown = evalAndConvertToStaticDropDown<string>(field);
    if (isDropdown) return isDropdown;

    // Apply Validators from the contentful model
    const validators = request.validators ?? [];
    // The field has contentful validation objects defined, convert them to validators
    if (field.validations) {
      field.validations.forEach((v) => {
        if (v['size']?.min) {
          validators.push(Validators.minLength(v['size'].min));
        }
        if (v['size']?.max) {
          validators.push(Validators.maxLength(v['size'].max));
        }
        if (v['regexp']) {
          validators.push(
            Validators.pattern(
              new RegExp(v['regexp'].pattern, v['regexp'].flags)
            )
          );
        }
        if (v['prohibitRegexp']) {
          validators.push(
            Validators.prohibitPattern(
              new RegExp(v['prohibitRegexp'].pattern, v['prohibitRegexp'].flags)
            )
          );
        }
      });
    }
    return Property.ShortText({
      ...request,
      displayName: field.name,
      required: field.required,
      validators,
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

    // Apply Validators from the contentful model
    const validators = request.validators ?? [];
    // The field has contentful validation objects defined, convert them to validators
    if (field.validations) {
      field.validations.forEach((v) => {
        if (v['range']?.min && v['range']?.max) {
          validators.push(Validators.inRange(v['range'].min, v['range'].max));
        } else if (v['range']?.min) {
          validators.push(Validators.minValue(v['range'].min));
        } else if (v['range']?.max) {
          validators.push(Validators.maxValue(v['range'].max));
        }
      });
    }
    return Property.Number({
      ...request,
      displayName: field.name,
      required: field.required,
      validators,
    });
  };

const DateTimeTransformer =
  (request: Properties<DateTimeProperty<true>> = {}) =>
  (field: ContentFields) => {
    const validators = request.validators ?? [];
    if (field.validations) {
      field.validations.forEach((v) => {
        if (v['dateRange']?.min && v['dateRange']?.max) {
          validators.push(
            Validators.inDateRange(
              v['dateRange'].min,
              v['dateRange'].max,
              'minute',
              true
            )
          );
        } else if (v['dateRange']?.min) {
          validators.push(
            Validators.minDate(v['dateRange'].min, 'minute', true)
          );
        } else if (v['dateRange']?.max) {
          validators.push(
            Validators.maxDate(v['dateRange'].max, 'minute', true)
          );
        }
      });
    }
    return Property.DateTime({
      ...request,
      displayName: field.name,
      required: field.required,
      validators,
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
  Symbol: ShortTextTransformer({ validators: [Validators.maxLength(256)] }),
  Text: LongTextTransformer({ validators: [Validators.maxLength(50000)] }),
  RichText: LongTextTransformer(),
  Integer: NumberTransformer({ validators: [Validators.integer] }),
  Number: NumberTransformer(),
  Date: DateTimeTransformer(),
  Boolean: CheckboxTransformer(),
  Object: ObjectTransformer({
    validators: [Validators.requireKeys(['lat', 'lon'])],
  }),
  Location: ObjectTransformer(),
  Link: LinkTransformer(),
  ResourceLink: LinkTransformer(),
  Array: ArrayTransformer(),
};
