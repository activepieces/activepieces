import { Property } from '@activepieces/pieces-framework';

import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharePointAiProps } from '../../../common/ai-props';

function columnId({ description }: { description: string }) {
  return Property.ShortText({ displayName: 'Column ID', description, required: true });
}

function contentTypeId({ description }: { description: string }) {
  return Property.ShortText({ displayName: 'Content Type ID', description, required: true });
}

function flagProps() {
  return {
    required: microsoftSharePointAiProps.booleanProp({
      displayName: 'Required',
      description: 'Whether a value is required in this column. Leave empty to keep the current setting.',
    }),
    hidden: microsoftSharePointAiProps.booleanProp({
      displayName: 'Hidden',
      description: 'Whether the column is hidden from forms and views. Leave empty to keep the current setting.',
    }),
  };
}

function definitionProps<R extends boolean>({ required }: { required: R }) {
  return {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Internal name of the column, used as its key in list item fields. Use no spaces or special characters.',
      required,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Name shown in the SharePoint interface.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the column.',
      required: false,
    }),
    columnType: Property.StaticDropdown({
      displayName: 'Column Type',
      description: 'Type of data the column holds. Type Settings holds the options for this type.',
      required,
      options: {
        disabled: false,
        options: COLUMN_TYPES.map((value) => ({ label: value, value })),
      },
    }),
    typeSettings: Property.Json({
      displayName: 'Type Settings',
      description:
        'Options of the chosen Column Type as a JSON object, like {"maxLength": 255} for text, {"choices": ["Red", "Blue"], "displayAs": "dropDownMenu"} for choice, {"decimalPlaces": "two"} for number, {"format": "dateOnly"} for dateTime, or {"listId": "<list ID>", "columnName": "Title"} for lookup. Leave empty for the defaults. Needs Column Type.',
      required: false,
    }),
    ...flagProps(),
    indexed: microsoftSharePointAiProps.booleanProp({
      displayName: 'Indexed',
      description: 'Whether the column is indexed for faster filtering and sorting.',
    }),
    enforceUniqueValues: microsoftSharePointAiProps.booleanProp({
      displayName: 'Enforce Unique Values',
      description: 'Whether no two items may have the same value in this column. Needs Indexed set to true.',
    }),
  };
}

function flagBody({ values }: { values: FlagValues }): Record<string, unknown> {
  return {
    ...microsoftSharePointUtils.optionalBoolean({ key: 'required', value: values.required, propName: 'Required' }),
    ...microsoftSharePointUtils.optionalBoolean({ key: 'hidden', value: values.hidden, propName: 'Hidden' }),
  };
}

function definitionBody({ values }: { values: DefinitionValues }): Record<string, unknown> {
  return {
    ...microsoftSharePointUtils.optionalText({ key: 'name', value: values.name }),
    ...microsoftSharePointUtils.optionalText({ key: 'displayName', value: values.displayName }),
    ...microsoftSharePointUtils.optionalText({ key: 'description', value: values.description }),
    ...flagBody({ values }),
    ...microsoftSharePointUtils.optionalBoolean({ key: 'indexed', value: values.indexed, propName: 'Indexed' }),
    ...microsoftSharePointUtils.optionalBoolean({
      key: 'enforceUniqueValues',
      value: values.enforceUniqueValues,
      propName: 'Enforce Unique Values',
    }),
    ...typeFacet({ columnType: values.columnType, typeSettings: values.typeSettings }),
  };
}

function requireChanges({ body }: { body: Record<string, unknown> }): Record<string, unknown> {
  if (Object.keys(body).length === 0) {
    throw new Error('Set at least one column field to update.');
  }
  return body;
}

function typeFacet({
  columnType,
  typeSettings,
}: {
  columnType: string | undefined;
  typeSettings: Record<string, unknown> | undefined;
}): Record<string, Record<string, unknown>> {
  const settings = typeSettings ?? {};
  if (columnType === undefined || columnType === '') {
    if (Object.keys(settings).length > 0) {
      throw new Error('Column Type is required when Type Settings is set.');
    }
    return {};
  }
  if (!COLUMN_TYPES.includes(columnType)) {
    throw new Error(`Column Type must be one of: ${COLUMN_TYPES.join(', ')}.`);
  }
  return { [columnType]: settings };
}

export const microsoftSharePointColumnDefinition = {
  columnId,
  contentTypeId,
  flagProps,
  definitionProps,
  flagBody,
  definitionBody,
  requireChanges,
};

const COLUMN_TYPES: string[] = [
  'text',
  'number',
  'boolean',
  'dateTime',
  'choice',
  'currency',
  'personOrGroup',
  'hyperlinkOrPicture',
  'lookup',
  'calculated',
  'geolocation',
  'term',
  'thumbnail',
];

type FlagValues = {
  required: string | undefined;
  hidden: string | undefined;
};

type DefinitionValues = FlagValues & {
  name: string | undefined;
  displayName: string | undefined;
  description: string | undefined;
  indexed: string | undefined;
  enforceUniqueValues: string | undefined;
  columnType: string | undefined;
  typeSettings: Record<string, unknown> | undefined;
};
