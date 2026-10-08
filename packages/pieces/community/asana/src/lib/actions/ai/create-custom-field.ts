import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import {
  ASANA_CUSTOM_FIELD_FORMAT_OPTIONS,
  ASANA_CUSTOM_LABEL_POSITION_OPTIONS,
  ASANA_FIELDS,
  ASANA_MAX_PRECISION,
  AsanaRecord,
  asanaClient,
  asanaProps,
  asanaUtils,
} from '../../common/client';

const TYPE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Single-select (enum)', value: 'enum' },
  { label: 'Multi-select (multi_enum)', value: 'multi_enum' },
  { label: 'Date', value: 'date' },
  { label: 'People', value: 'people' },
];

export const asanaCreateCustomFieldAction = createAction({
  auth: asanaAuth,
  name: 'create_custom_field',
  classification: 'WRITE',
  displayName: 'Create Custom Field',
  description: 'Create a custom field definition in an Asana workspace (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a workspace-wide custom field definition (text, number, single-select, multi-select, date or people) and returns it with its enum options. The name must be unique in the workspace and must not clash with built-in fields such as Due Date or Assignee; the type can never be changed later. Check List Custom Fields first to avoid a duplicate. For select fields, pass the option names here or add them later with Create Custom Field Enum Option. Custom fields need a paid Asana plan; a free workspace gets a paid-plan error. Not idempotent: a repeat fails on the duplicate name.',
    idempotent: false,
  },
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace that will own the field; it cannot be moved later. Obtain it from List Workspaces.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Field Name',
      description: 'Name of the field, unique in the workspace, for example "Priority".',
      required: true,
    }),
    resource_subtype: Property.StaticDropdown({
      displayName: 'Field Type',
      description: 'Kind of value the field holds. It cannot be changed after creation.',
      required: true,
      options: { disabled: false, options: TYPE_OPTIONS },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Plain-text description shown with the field.',
      required: false,
    }),
    enum_options: Property.Array({
      displayName: 'Option Names',
      description: 'Only for single-select and multi-select fields: the option names in display order, for example High, Medium, Low (1 to 500 options).',
      required: false,
    }),
    precision: Property.Number({
      displayName: 'Decimal Places',
      description: `Only for number fields: digits after the decimal point, 0 to ${ASANA_MAX_PRECISION}.`,
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Number Format',
      description: 'Only for number fields: how the value is displayed. Leave empty for plain numbers.',
      required: false,
      options: { disabled: false, options: ASANA_CUSTOM_FIELD_FORMAT_OPTIONS },
    }),
    currency_code: Property.ShortText({
      displayName: 'Currency Code',
      description: 'ISO 4217 code such as USD or EUR. Only used with the Currency format.',
      required: false,
    }),
    custom_label: Property.ShortText({
      displayName: 'Custom Label',
      description: 'Unit text shown next to the value, for example "pts". Only used with the Custom label format.',
      required: false,
    }),
    custom_label_position: Property.StaticDropdown({
      displayName: 'Custom Label Position',
      description: 'Where the custom label goes. Only used with the Custom label format.',
      required: false,
      options: { disabled: false, options: ASANA_CUSTOM_LABEL_POSITION_OPTIONS },
    }),
    has_notifications_enabled: asanaProps.optionalBoolean({
      displayName: 'Notify Followers on Change',
      description: 'Yes to notify task followers when this field changes, No to stay silent. Leave empty for the Asana default.',
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const type = props.resource_subtype;
    const optionNames = asanaUtils.toStringArray(props.enum_options);
    const isSelect = type === 'enum' || type === 'multi_enum';
    if (optionNames.length > 0 && !isSelect) {
      throw new Error('Option Names only apply to single-select (enum) and multi-select (multi_enum) fields.');
    }
    if (isSelect && optionNames.length > 500) {
      throw new Error(`A select field can have at most 500 options; got ${optionNames.length}.`);
    }
    if (asanaUtils.hasValue(props.precision) && type !== 'number') {
      throw new Error('Decimal Places only applies to number fields.');
    }
    const data: Record<string, unknown> = {
      workspace: props.workspace.trim(),
      name: props.name,
      resource_subtype: type,
      ...(asanaUtils.hasValue(props.description) ? { description: props.description } : {}),
      ...(optionNames.length > 0 ? { enum_options: optionNames.map((name) => ({ name })) } : {}),
      ...(asanaUtils.hasValue(props.precision) ? { precision: asanaUtils.assertPrecision(props.precision) } : {}),
      ...(asanaUtils.hasValue(props.format) ? { format: props.format } : {}),
      ...(asanaUtils.hasValue(props.currency_code) ? { currency_code: String(props.currency_code).trim().toUpperCase() } : {}),
      ...(asanaUtils.hasValue(props.custom_label) ? { custom_label: props.custom_label } : {}),
      ...(asanaUtils.hasValue(props.custom_label_position) ? { custom_label_position: props.custom_label_position } : {}),
      ...(typeof props.has_notifications_enabled === 'boolean' ? { has_notifications_enabled: props.has_notifications_enabled } : {}),
    };
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/custom_fields',
      operation: 'Create Custom Field',
      query: { opt_fields: ASANA_FIELDS.customField },
      data,
    });
  },
});
