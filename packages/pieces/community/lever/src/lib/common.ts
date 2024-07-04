import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';

export type LeverFieldType = {
  id: string;
  text: string;
  description: string;
  required: boolean;
  type: string;
  options?: { text: string; optionId: string }[];
  scores?: { text: string; description: string }[];
};

export const LeverFieldMapping: Record<
  string,
  {
    buildActivepieceType: (
      fields: DynamicPropsValue,
      field: LeverFieldType
    ) => void;
    buildLeverType: (
      id: string,
      propsValues: DynamicPropsValue[]
    ) => {
      id: string;
      value:
        | string
        | string[]
        | number
        | number[]
        | { score: number; comment?: string }[];
    };
  }
> = {
  default: {
    buildActivepieceType: (fields, field) =>
      (fields[field.id] = Property.ShortText({
        displayName: field.text,
        description: field.description,
        required: field.required,
      })),
    buildLeverType: (id, propsValues) => ({
      id,
      value: propsValues[0] as unknown as string,
    }),
  },
  textarea: {
    buildActivepieceType: (fields, field) =>
      (fields[field.id] = Property.LongText({
        displayName: field.text,
        description: field.description,
        required: field.required,
      })),
    buildLeverType: (id, propsValues) => ({
      id,
      value: propsValues[0] as unknown as string,
    }),
  },
  'yes-no': {
    buildActivepieceType: (fields, field) =>
      (fields[field.id] = Property.Checkbox({
        displayName: field.text,
        description: field.description,
        required: field.required,
      })),
    buildLeverType: (id, propsValues) => {
      const value = propsValues[0] as unknown as boolean;
      return {
        id,
        value: value === true ? 'yes' : value === false ? 'no' : 'null',
      };
    },
  },
  dropdown: {
    buildActivepieceType: (fields, field) =>
      (fields[field.id] = Property.StaticDropdown({
        displayName: field.text,
        description: field.description,
        required: field.required,
        options: {
          disabled: false,
          options:
            field.options?.map((option: { text: string; optionId: string }) => {
              return { value: option.text, label: option.text };
            }) || [],
        },
      })),
    buildLeverType: (id, propsValues) => ({
      id,
      value: propsValues[0] as unknown as string,
    }),
  },
  'multiple-choice': {
    buildActivepieceType: (fields, field) =>
      (fields[field.id] = Property.StaticDropdown({
        displayName: field.text,
        description: field.description,
        required: field.required,
        options: {
          disabled: false,
          options:
            field.options?.map((option: { text: string; optionId: string }) => {
              return { value: option.text, label: option.text };
            }) || [],
        },
      })),
    buildLeverType: (id, propsValues) => ({
      id,
      value: propsValues[0] as unknown as string,
    }),
  },
  'multiple-select': {
    buildActivepieceType: (fields, field) =>
      (fields[field.id] = Property.StaticMultiSelectDropdown({
        displayName: field.text,
        description: field.description,
        required: field.required,
        options: {
          disabled: false,
          options:
            field.options?.map((option: { text: string; optionId: string }) => {
              return { value: option.text, label: option.text };
            }) || [],
        },
      })),
    buildLeverType: (id, propsValues) => ({
      id,
      value: propsValues[0] as unknown as string[],
    }),
  },
  'score-system': {
    buildActivepieceType: (fields, field) =>
      (fields[field.id] = Property.StaticDropdown({
        displayName: field.text,
        description: field.description,
        required: field.required,
        options: {
          options:
            field.options?.map((option) => {
              return { value: option.text, label: option.text };
            }) || [],
        },
      })),
    buildLeverType: (id, propsValues) => ({
      id,
      value: propsValues[0] as unknown as string,
    }),
  },
  scorecard: {
    buildActivepieceType: (fields, field) =>
      field.scores?.map((score, index) => {
        fields[`${field.id}-${index}`] = Property.StaticDropdown({
          displayName: score.text,
          description: score.description,
          required: field.required,
          options: {
            options: [
              { label: 'n.a.', value: 0 },
              { label: '👎👎', value: 1 },
              { label: '👎', value: 2 },
              { label: '👍', value: 3 },
              { label: '👍👍', value: 4 },
            ],
          },
        });
      }),
    buildLeverType: (id, propsValues) => ({
      id,
      value: propsValues.map((propsValue: DynamicPropsValue) => {
        return {
          score: propsValue as unknown as number,
          comment: '',
        };
      }),
    }),
  },
};
