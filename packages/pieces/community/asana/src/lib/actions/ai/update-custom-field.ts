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

export const asanaUpdateCustomFieldAction = createAction({
  auth: asanaAuth,
  name: 'update_custom_field',
  classification: 'WRITE',
  displayName: 'Update Custom Field',
  description: 'Change the name, description, number format or notifications of an Asana custom field (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the custom field settings you set (name, description, number format, precision, currency, custom label, follower notifications); everything else is left unchanged. The field type can never change, and select options are edited with Create, Update and Reorder Custom Field Enum Option, not here. Locked fields can only be changed by the user who locked them. Needs a paid Asana plan; a free workspace gets a paid-plan error. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    custom_field: Property.ShortText({
      displayName: 'Custom Field GID',
      description: 'Gid of the custom field to update. Obtain it from List Custom Fields.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Field Name',
      description: 'New name, unique in the workspace. Leave empty to keep it.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New plain-text description; replaces the current one. Leave empty to keep it.',
      required: false,
    }),
    precision: Property.Number({
      displayName: 'Decimal Places',
      description: `Number fields only: digits after the decimal point, 0 to ${ASANA_MAX_PRECISION}. Leave empty to keep it.`,
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Number Format',
      description: 'Number fields only: new display format. Leave empty to keep it.',
      required: false,
      options: { disabled: false, options: ASANA_CUSTOM_FIELD_FORMAT_OPTIONS },
    }),
    currency_code: Property.ShortText({
      displayName: 'Currency Code',
      description: 'ISO 4217 code such as USD, used with the Currency format. Leave empty to keep it.',
      required: false,
    }),
    custom_label: Property.ShortText({
      displayName: 'Custom Label',
      description: 'Unit text used with the Custom label format. Leave empty to keep it.',
      required: false,
    }),
    custom_label_position: Property.StaticDropdown({
      displayName: 'Custom Label Position',
      description: 'Where the custom label goes. Leave empty to keep it.',
      required: false,
      options: { disabled: false, options: ASANA_CUSTOM_LABEL_POSITION_OPTIONS },
    }),
    has_notifications_enabled: asanaProps.optionalBoolean({
      displayName: 'Notify Followers on Change',
      description: 'Yes to notify task followers when this field changes, No to stop those notifications. Leave empty to keep the current setting.',
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(props.name) ? { name: props.name } : {}),
      ...(asanaUtils.hasValue(props.description) ? { description: props.description } : {}),
      ...(asanaUtils.hasValue(props.precision) ? { precision: asanaUtils.assertPrecision(props.precision) } : {}),
      ...(asanaUtils.hasValue(props.format) ? { format: props.format } : {}),
      ...(asanaUtils.hasValue(props.currency_code) ? { currency_code: String(props.currency_code).trim().toUpperCase() } : {}),
      ...(asanaUtils.hasValue(props.custom_label) ? { custom_label: props.custom_label } : {}),
      ...(asanaUtils.hasValue(props.custom_label_position) ? { custom_label_position: props.custom_label_position } : {}),
      ...(typeof props.has_notifications_enabled === 'boolean' ? { has_notifications_enabled: props.has_notifications_enabled } : {}),
    };
    asanaUtils.assertNotEmpty({
      patch: data,
      fields: 'Field Name, Description, Decimal Places, Number Format, Currency Code, Custom Label, Custom Label Position or Notify Followers on Change',
    });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/custom_fields/${asanaUtils.pathSegment(props.custom_field)}`,
      operation: 'Update Custom Field',
      query: { opt_fields: ASANA_FIELDS.customField },
      data,
    });
  },
});
