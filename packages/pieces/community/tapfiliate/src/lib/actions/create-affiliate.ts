import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { tapfiliateAuth } from '../common/auth';
import { tapfiliateApiCall } from '../common/tapfiliate.client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const createAffiliateAction = createAction({
  auth: tapfiliateAuth,
  name: 'create_affiliate',
  displayName: 'Create Affiliate',
  description: 'Creates a new affiliate in Tapfiliate.',
  props: {
    firstname: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for the new affiliate account.',
      required: true,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    companyDescription: Property.LongText({
      displayName: 'Company Description',
      required: false,
    }),
    addressLine1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    addressLine2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 code, e.g. US or NL.',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      required: false,
    }),
  },
  async run(context) {
    const company =
      context.propsValue.companyName || context.propsValue.companyDescription
        ? {
            ...(context.propsValue.companyName
              ? { name: context.propsValue.companyName }
              : {}),
            ...(context.propsValue.companyDescription
              ? { description: context.propsValue.companyDescription }
              : {}),
          }
        : undefined;

    const address =
      context.propsValue.addressLine1 ||
      context.propsValue.addressLine2 ||
      context.propsValue.postalCode ||
      context.propsValue.city ||
      context.propsValue.state ||
      context.propsValue.countryCode
        ? {
            ...(context.propsValue.addressLine1
              ? { address: context.propsValue.addressLine1 }
              : {}),
            ...(context.propsValue.addressLine2
              ? { address_two: context.propsValue.addressLine2 }
              : {}),
            ...(context.propsValue.postalCode
              ? { postal_code: context.propsValue.postalCode }
              : {}),
            ...(context.propsValue.city ? { city: context.propsValue.city } : {}),
            ...(context.propsValue.state
              ? { state: context.propsValue.state }
              : {}),
            ...(context.propsValue.countryCode
              ? { country: { code: context.propsValue.countryCode } }
              : {}),
          }
        : undefined;

    const customFields = isRecord(context.propsValue.customFields)
      ? context.propsValue.customFields
      : undefined;

    return await tapfiliateApiCall({
      method: HttpMethod.POST,
      path: '/affiliates/',
      apiKey: context.auth.secret_text,
      body: {
        firstname: context.propsValue.firstname,
        lastname: context.propsValue.lastname,
        email: context.propsValue.email,
        password: context.propsValue.password,
        ...(company ? { company } : {}),
        ...(address ? { address } : {}),
        ...(customFields ? { custom_fields: customFields } : {}),
      },
    });
  },
});
