import { Property } from '@activepieces/pieces-framework';
import { flowluCommon } from '.';

export const flowluProps = {
  task: {
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Low',
            value: 1,
          },
          {
            label: 'Medium',
            value: 2,
          },
          {
            label: 'High',
            value: 3,
          },
        ],
      },
    }),
    plan_start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
      description: 'Please use YYYY-MM-DD HH:mm:ss format.',
    }),
    deadline: Property.DateTime({
      displayName: 'End Date',
      required: false,
      description: 'Please use YYYY-MM-DD HH:mm:ss format.',
    }),
    deadline_allowchange: Property.Checkbox({
      displayName: 'The assignee can change the end date for this task?',
      required: false,
      defaultValue: false,
    }),
    task_checkbyowner: Property.Checkbox({
      displayName: 'This task needs approval from the owner?',
      required: false,
      defaultValue: false,
    }),
    responsible_id: flowluCommon.user_id(false, 'Assignee ID'),
    owner_id: flowluCommon.user_id(false, 'Owner ID'),
    type: Property.StaticDropdown({
      displayName: 'Task Type',
      required: false,
      defaultValue: 0,
      options: {
        disabled: false,
        options: [
          {
            label: 'Task',
            value: 0,
          },
          {
            label: 'Inbox',
            value: 1,
          },
          {
            label: 'Event',
            value: 20,
          },
          {
            label: 'Task template',
            value: 30,
          },
        ],
      },
    }),
    workflow_id: flowluCommon.workflow_id(false),
    workflow_stage_id: flowluCommon.workflow_stage_id(false),
  },
  account: {
    owner_id: flowluCommon.user_id(false, 'Assignee ID'),
    account_category_id: flowluCommon.account_category_id(false),
    industry_id: flowluCommon.industry_id(false),
    web: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Primary Phone Number',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    vat: Property.ShortText({
      displayName: 'VAT or TAX ID',
      required: false,
    }),
    bank_details: Property.LongText({
      displayName: 'Bank Details',
      required: false,
    }),
    telegram: Property.ShortText({
      displayName: 'Telegram',
      required: false,
    }),
    skype: Property.ShortText({
      displayName: 'Skype Account ID',
      required: false,
    }),
    link_google: Property.ShortText({
      displayName: 'Link to Google+',
      required: false,
    }),
    link_facebook: Property.ShortText({
      displayName: 'Link to Facebook',
      required: false,
    }),
    link_linkedin: Property.ShortText({
      displayName: 'Link to Linkedin',
      required: false,
    }),
    link_instagram: Property.ShortText({
      displayName: 'Link to Instagram',
      required: false,
    }),
    billing_country: Property.ShortText({
      displayName: 'Billing Country',
      required: false,
    }),
    billing_state: Property.ShortText({
      displayName: 'Billing State',
      required: false,
    }),
    billing_city: Property.ShortText({
      displayName: 'Billing City',
      required: false,
    }),
    billing_zip: Property.ShortText({
      displayName: 'Billing Postal code',
      required: false,
    }),
    billing_address_line_1: Property.ShortText({
      displayName: 'Billing Address Line 1',
      required: false,
    }),
    billing_address_line_2: Property.ShortText({
      displayName: 'Billing Address Line 2',
      required: false,
    }),
    billing_address_line_3: Property.ShortText({
      displayName: 'Billing Address Line 3',
      required: false,
    }),
    shipping_country: Property.ShortText({
      displayName: 'Shipping Country',
      required: false,
    }),
    shipping_state: Property.ShortText({
      displayName: 'Shipping State',
      required: false,
    }),
    shipping_city: Property.ShortText({
      displayName: 'Shipping City',
      required: false,
    }),
    shipping_zip: Property.ShortText({
      displayName: 'Shipping Postal code',
      required: false,
    }),
    shipping_address_line_1: Property.ShortText({
      displayName: 'Shipping Address Line 1',
      required: false,
    }),
    shipping_address_line_2: Property.ShortText({
      displayName: 'Shipping Address Line 2',
      required: false,
    }),
    shipping_address_line_3: Property.ShortText({
      displayName: 'Shipping Address Line 3',
      required: false,
    }),
  },
  opportunity: {
    budget: Property.Number({
      displayName: 'Opportunity Amount',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    source_id: flowluCommon.source_id(false),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
      description: 'Please use YYYY-MM-DD HH:mm:ss format.',
    }),
    deadline: Property.DateTime({
      displayName: 'End Date',
      required: false,
      description: 'Please use YYYY-MM-DD HH:mm:ss format.',
    }),
    assignee_id: flowluCommon.user_id(false, 'Assignee ID'),
    customer_id: flowluCommon.account_id(
      false,
      'Customer ID',
      `This is an id of the CRM company or contact which is needed to be linked with the opportunity. This allows you to link the client to the opportunity. If your client is a company, and you need to relate an opportunity to the person (contact) at this company, then enter his/her id in the contact_id field.`
    ),
    contact_id: flowluCommon.contact_id(
      false,
      'Contact ID',
      `Id of the company-related contact (account_id).`
    ),
    pipeline_id: flowluCommon.pipeline_id(false),
    pipeline_stage_id: flowluCommon.pipeline_stage_id(false),
  },
};
