import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dripCommon } from '../common';
import { dripApi } from '../common/client';
import { dripAuth } from '../auth';
import { dripOutputSchemas } from '../output-schemas';

export const dripUpsertSubscriberAction = createAction({
  auth: dripAuth,
  name: 'upsert_subscriber',
  classification: 'WRITE',
  description: 'Create or Update Subscriber',
  audience: 'human',
  aiMetadata: { description: 'Creates a subscriber in a Drip account, or updates the existing one matched by email address, setting tags, custom fields, and contact details (name, address, phone, location). Use to add a new contact or keep an existing contact in sync. Idempotent: matched on the stable email, so repeating with the same input converges to the same record.', idempotent: true },
  displayName: 'Create or Update Subscriber',
  props: {
    account_id: dripCommon.account_id,
    subscriber: dripCommon.subscriber,
    tags: dripCommon.tags,
    custom_fields: dripCommon.custom_fields,
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip Code',
      description: 'Postal code in which the subscriber resides',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'The country in which the subscriber resides',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'The region in which the subscriber resides',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city in which the subscriber resides',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: "The subscriber's primary phone number",
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: "Address line 1 of the subscriber's mailing address",
      required: false,
    }),
  },
  outputSchema: dripOutputSchemas.legacySubscribersResponse,
  async run({ auth, propsValue }) {
    return await dripApi.send<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(propsValue.account_id)}/subscribers`,
      operation: 'create or update subscriber',
      body: {
        subscribers: [
          {
            email: propsValue.subscriber,
            tags: propsValue.tags,
            custom_fields: propsValue.custom_fields,
            country: propsValue.country,
            address1: propsValue.address,
            city: propsValue.city,
            state: propsValue.state,
            zip: propsValue.zip,
            phone: propsValue.phone,
            first_name: propsValue.first_name,
            last_name: propsValue.last_name,
          },
        ],
      },
    });
  },
});
