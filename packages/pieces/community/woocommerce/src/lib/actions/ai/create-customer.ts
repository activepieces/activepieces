import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooValues } from '../../common/props';
import { createCustomerOutputSchema } from '../../output-schemas';

export const wooAiCreateCustomer = createAction({
  name: 'create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Create a customer account. Only the email is required.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a customer account (a WordPress user with the customer role); only the email is required. Check list_customers by email first, because an email that is already registered is rejected. Username and password are generated when the store settings allow it, otherwise a password must be given; the store may email the new customer their account details.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createCustomerOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the customer. Must not already be registered.',
      required: true,
    }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Login name. Generated from the email when empty and the store allows it.',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Account password. Generated when empty and the store allows it.',
      required: false,
    }),
    billing_company: Property.ShortText({ displayName: 'Billing Company', required: false }),
    billing_address_1: Property.ShortText({ displayName: 'Billing Address Line 1', required: false }),
    billing_address_2: Property.ShortText({ displayName: 'Billing Address Line 2', required: false }),
    billing_city: Property.ShortText({ displayName: 'Billing City', required: false }),
    billing_state: Property.ShortText({
      displayName: 'Billing State',
      description: 'State or county code, e.g. CA.',
      required: false,
    }),
    billing_postcode: Property.ShortText({ displayName: 'Billing Postcode', required: false }),
    billing_country: Property.ShortText({
      displayName: 'Billing Country',
      description: 'Two-letter ISO country code, e.g. US.',
      required: false,
    }),
    billing_phone: Property.ShortText({ displayName: 'Billing Phone', required: false }),
    shipping_company: Property.ShortText({ displayName: 'Shipping Company', required: false }),
    shipping_address_1: Property.ShortText({ displayName: 'Shipping Address Line 1', required: false }),
    shipping_address_2: Property.ShortText({ displayName: 'Shipping Address Line 2', required: false }),
    shipping_city: Property.ShortText({ displayName: 'Shipping City', required: false }),
    shipping_state: Property.ShortText({
      displayName: 'Shipping State',
      description: 'State or county code, e.g. CA.',
      required: false,
    }),
    shipping_postcode: Property.ShortText({ displayName: 'Shipping Postcode', required: false }),
    shipping_country: Property.ShortText({
      displayName: 'Shipping Country',
      description: 'Two-letter ISO country code, e.g. US.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const firstName = wooValues.nonEmpty(props.first_name);
    const lastName = wooValues.nonEmpty(props.last_name);
    const billing = wooValues.pruneUndefined({
      company: wooValues.nonEmpty(props.billing_company),
      address_1: wooValues.nonEmpty(props.billing_address_1),
      address_2: wooValues.nonEmpty(props.billing_address_2),
      city: wooValues.nonEmpty(props.billing_city),
      state: wooValues.nonEmpty(props.billing_state),
      postcode: wooValues.nonEmpty(props.billing_postcode),
      country: wooValues.nonEmpty(props.billing_country),
      phone: wooValues.nonEmpty(props.billing_phone),
    });
    const shipping = wooValues.pruneUndefined({
      company: wooValues.nonEmpty(props.shipping_company),
      address_1: wooValues.nonEmpty(props.shipping_address_1),
      address_2: wooValues.nonEmpty(props.shipping_address_2),
      city: wooValues.nonEmpty(props.shipping_city),
      state: wooValues.nonEmpty(props.shipping_state),
      postcode: wooValues.nonEmpty(props.shipping_postcode),
      country: wooValues.nonEmpty(props.shipping_country),
    });
    const body = wooValues.pruneUndefined({
      email: props.email.trim(),
      first_name: firstName,
      last_name: lastName,
      username: wooValues.nonEmpty(props.username),
      password: wooValues.nonEmpty(props.password),
      billing: Object.keys(billing).length > 0 ? billing : undefined,
      shipping: Object.keys(shipping).length > 0 ? shipping : undefined,
    });
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/customers',
      body,
    });
  },
});
