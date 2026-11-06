import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesProps } from '../common/props';
import { freshsalesRecords } from '../common/records';
import { createContactOutputSchema } from '../output-schemas';

export const freshSalesCreateContact = createAction({
  auth: freshsalesAuth,
  name: 'freshsales_create_contact',
  displayName: 'Create Contact',
  description: 'Add new contact in Freshsales CRM',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new contact in Freshsales and returns it with its ID. Email is required; owner, territory, status, lifecycle stage and lead source take IDs from the dropdowns or the List Field Options tool; Sales account id links the contact to an account as primary. Custom Fields is a JSON object keyed by cf_ API names. Not idempotent: each call creates a new contact; use Upsert Contact to avoid duplicates.',
    idempotent: false,
  },
  outputSchema: createContactOutputSchema,
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
    medium: Property.ShortText({
      displayName: 'Medium',
      description: 'Medium that led the contact to you',
      placeholder: 'email',
      required: false,
    }),
    campaign_id: freshsalesProps.campaign(),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Keywords the contact used to find you',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Time zone of the contact',
      placeholder: 'Eastern Time (US & Canada)',
      required: false,
    }),
    facebook: Property.ShortText({
      displayName: 'Facebook',
      description: 'Facebook username of the contact',
      required: false,
    }),
    twitter: Property.ShortText({
      displayName: 'Twitter',
      description: 'Twitter username of the contact',
      required: false,
    }),
    linkedin: Property.ShortText({
      displayName: 'Linkedin',
      description: 'LinkedIn profile of the contact',
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
      medium: context.propsValue.medium,
      campaign_id: context.propsValue.campaign_id,
      keyword: context.propsValue.keyword,
      time_zone: context.propsValue.time_zone,
      facebook: context.propsValue.facebook,
      twitter: context.propsValue.twitter,
      linkedin: context.propsValue.linkedin,
    });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/contacts',
      query: { include: freshsalesRecords.RECORD_INCLUDES.contacts },
      body: { contact },
    });
    const created = freshsalesRecords.shapeContact(
      freshsalesClient.unwrap({ body: response, key: 'contact' })
    );
    return { ...created, contact: created };
  },
});
