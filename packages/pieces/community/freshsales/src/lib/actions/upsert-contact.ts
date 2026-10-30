import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesProps } from '../common/props';
import { freshsalesRecords } from '../common/records';
import { contactOutputSchema } from '../output-schemas';

export const upsertContact = createAction({
  auth: freshsalesAuth,
  name: 'upsert_contact',
  displayName: 'Create or Update Contact',
  description: 'Update the contact with this email, or create it',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a contact, or updates the existing contact that has the same email address (Freshsales upsert keyed on emails). Use this instead of Create Contact when the contact may already exist. Idempotent: a second call with the same email updates the same contact and does not create a duplicate.',
    idempotent: true,
  },
  outputSchema: contactOutputSchema,
  props: {
    first_name: Property.ShortText({
      displayName: 'First name',
      description: 'First name of the contact',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last name',
      description: 'Last name of the contact',
      required: false,
    }),
    job_title: Property.ShortText({
      displayName: 'Job title',
      description: 'Job title of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Primary email address of the contact',
      placeholder: 'jane@acme.com',
      required: true,
    }),
    work_number: Property.ShortText({
      displayName: 'Work number',
      description: 'Work phone number of the contact',
      required: false,
    }),
    mobile_number: Property.ShortText({
      displayName: 'Mobile number',
      description: 'Mobile phone number of the contact',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Street address of the contact',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City of the contact',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State of the contact',
      required: false,
    }),
    zipcode: Property.ShortText({
      displayName: 'Zip code',
      description: 'Zip code of the contact',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country of the contact',
      required: false,
    }),
    territory_id: freshsalesProps.territory(),
    owner_id: freshsalesProps.owner({ required: false }),
    subscription_status: Property.StaticDropdown({
      displayName: 'Subscription status',
      description: 'Email subscription status of the contact',
      required: false,
      options: {
        disabled: false,
        options: freshsalesRecords.SUBSCRIPTION_STATUS_OPTIONS,
      },
    }),
    contact_status_id: freshsalesProps.contactStatus(),
    lifecycle_stage_id: freshsalesProps.lifecycleStage(),
    lead_source_id: freshsalesProps.leadSource(),
    sales_account_id: Property.ShortText({
      displayName: 'Sales account id',
      description: 'ID of the primary account of the contact',
      placeholder: '16000123456',
      required: false,
    }),
    custom_fields: freshsalesProps.customFields(),
  },
  async run(context) {
    const contact = freshsalesRecords.buildContactBody({
      first_name: context.propsValue.first_name,
      last_name: context.propsValue.last_name,
      job_title: context.propsValue.job_title,
      email: context.propsValue.email,
      work_number: context.propsValue.work_number,
      mobile_number: context.propsValue.mobile_number,
      address: context.propsValue.address,
      city: context.propsValue.city,
      state: context.propsValue.state,
      zipcode: context.propsValue.zipcode,
      country: context.propsValue.country,
      territory_id: context.propsValue.territory_id,
      owner_id: context.propsValue.owner_id,
      subscription_status: context.propsValue.subscription_status,
      contact_status_id: context.propsValue.contact_status_id,
      lifecycle_stage_id: context.propsValue.lifecycle_stage_id,
      lead_source_id: context.propsValue.lead_source_id,
      sales_account_id: context.propsValue.sales_account_id,
      custom_fields: context.propsValue.custom_fields,
    });
    const email = String(contact['email'] ?? '');
    if (email.length === 0) {
      throw new Error('Email is required to create or update a contact.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/contacts/upsert',
      query: { include: freshsalesRecords.RECORD_INCLUDES.contacts },
      body: { unique_identifier: { emails: email }, contact },
    });
    return freshsalesRecords.shapeContact(
      freshsalesClient.unwrap({ body: response, key: 'contact' })
    );
  },
});
