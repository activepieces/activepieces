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

type Properties<T> = Omit<
  T,
  | 'valueSchema'
  | 'type'
  | 'defaultValidators'
  | 'defaultProcessors'
  | 'required'
  | 'displayName'
>;

const ShortTextTransformer =
  (request: Properties<ShortTextProperty<true>> = {}) =>
  (field: ContentFields) => {
    const validations = [];
    const options: DropdownOption<string>[] = [];
    if (field.validations) {
      field.validations.forEach((v) => {
        if (v['in']) {
          options.push(
            ...v['in'].map((o) => ({ label: o as string, value: o as string }))
          );
        }
        if (v['size']?.min) {
          validations.push(Validators.minLength(v['size'].min));
        }
        if (v['size']?.max) {
          validations.push(Validators.maxLength(v['size'].max));
        }
      });
    }
    if (options.length > 0) {
      return Property.StaticDropdown({
        displayName: field.name,
        required: field.required,
        options: {
          disabled: false,
          placeholder: 'Select an option',
          options,
        },
      });
    }

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
  (field: ContentFields) =>
    Property.Number({
      ...request,
      displayName: field.name,
      required: field.required,
    });

const DateTimeTransformer =
  (request: Properties<DateTimeProperty<true>> = {}) =>
  (field: ContentFields) =>
    Property.DateTime({
      ...request,
      displayName: field.name,
      required: field.required,
    });

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
    const linkType = field.linkType;
    if (!linkType || linkType === 'Entry') {
      return ShortTextTransformer(request)(field);
    }

    return Property.File({
      displayName: field.name,
      required: field.required,
    });
  };

const ArrayTransformer =
  (request: Properties<ArrayProperty<true>> = {}) =>
  (field: ContentFields) => {
    // Is this an array of strings?
    if (field.items?.type === 'Symbol') {
      return Property.Array({
        ...request,
        displayName: field.name,
        required: field.required,
      });
    }
    // No Support for Other Array Types at the Moment
    return Property.LongText({
      displayName: field.name,
      required: field.required,
      description: 'Unsupported Array Type',
    });
  };

type Transformer = (field: ContentFields) => BasePropertySchema;

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
