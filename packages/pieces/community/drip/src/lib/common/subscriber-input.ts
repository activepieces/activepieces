import { Property } from '@activepieces/pieces-framework';
import { dripApi } from './client';

export const subscriberFieldProps = {
  firstName: Property.ShortText({ displayName: 'First Name', required: false }),
  lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
  address1: Property.ShortText({ displayName: 'Address Line 1', required: false }),
  address2: Property.ShortText({ displayName: 'Address Line 2', required: false }),
  city: Property.ShortText({ displayName: 'City', required: false }),
  state: Property.ShortText({ displayName: 'State / Region', required: false }),
  zip: Property.ShortText({ displayName: 'Postal Code', required: false }),
  country: Property.ShortText({ displayName: 'Country', required: false }),
  phone: Property.ShortText({ displayName: 'Phone', required: false }),
  userId: Property.ShortText({ displayName: 'Your User ID', description: 'Your own ID for this person, e.g. the primary key in your database.', required: false }),
  timeZone: Property.ShortText({ displayName: 'Time Zone', description: 'Olson time zone, e.g. America/Los_Angeles.', required: false }),
};

export const subscriberInput = {
  fields: buildFields,
};

function buildFields(values: SubscriberFieldValues): Record<string, unknown> {
  return dripApi.compact({
    first_name: dripApi.optionalText(values.firstName),
    last_name: dripApi.optionalText(values.lastName),
    address1: dripApi.optionalText(values.address1),
    address2: dripApi.optionalText(values.address2),
    city: dripApi.optionalText(values.city),
    state: dripApi.optionalText(values.state),
    zip: dripApi.optionalText(values.zip),
    country: dripApi.optionalText(values.country),
    phone: dripApi.optionalText(values.phone),
    user_id: dripApi.optionalText(values.userId),
    time_zone: dripApi.optionalText(values.timeZone),
    custom_fields: dripApi.parseObject({ value: values.customFields, label: 'Custom Fields' }),
    tags: nonEmpty(dripApi.textList(values.tags)),
  });
}

function nonEmpty(list: string[] | undefined): string[] | undefined {
  return list && list.length > 0 ? list : undefined;
}

type SubscriberFieldValues = {
  firstName?: unknown;
  lastName?: unknown;
  address1?: unknown;
  address2?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
  country?: unknown;
  phone?: unknown;
  userId?: unknown;
  timeZone?: unknown;
  customFields?: unknown;
  tags?: unknown;
};
