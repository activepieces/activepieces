import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepOutputSchemas } from '../common/output-schemas';
import { chargekeepServices } from '../common/services';

export const addOrUpdateSubscription = createAction({
  name: 'addOrUpdateSubscription',
  classification: 'WRITE',
  displayName: 'Add or Update Subscription',
  description: 'Adds a product subscription to a contact, or replaces the one for that product.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates or replaces a product subscription for one contact in the ChargeKeep/Sperse CRM. Identify the contact by contactId (number) or contactXref (your external ID); give the productCode (SKU) of an existing subscription product and a paymentPeriodType that the product offers (Monthly, Annual, LifeTime, OneTime, Custom). Does not charge a card. Running it again for the same contact and product replaces that subscription (new subscription ID, start date reset) instead of adding a second one. Returns the contact ID and the resulting subscription.',
    idempotent: false,
  },
  outputSchema: chargekeepOutputSchemas.subscriptionUpdate,
  auth: chargekeepAuth,
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['contact_info', 'contactId', 'contactXref'],
    },
    {
      key: 'subscription',
      display: 'section',
      label: 'Subscription',
      icon: 'calendar',
      props: ['productCode', 'productId', 'paymentPeriodType', 'hasRecurringBilling'],
    },
  ],
  props: {
    contact_info: Property.MarkDown({
      value: 'Give the Contact ID or the External Contact ID.',
      variant: MarkdownVariant.INFO,
    }),
    contactId: Property.Number({
      displayName: 'Contact ID',
      required: false,
      width: 'half',
    }),
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'Optional. The product is found by its code.',
      required: false,
      width: 'half',
    }),
    contactXref: Property.ShortText({
      displayName: 'External Contact ID',
      description: 'Your own ID for the contact (XREF in ChargeKeep).',
      required: false,
      width: 'half',
    }),
    productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'SKU of an existing subscription product.',
      required: true,
      width: 'half',
    }),
    paymentPeriodType: Property.StaticDropdown({
      displayName: 'Billing Period',
      description: 'Must be a period set up on the product in ChargeKeep.',
      required: true,
      defaultValue: 'Monthly',
      width: 'half',
      options: {
        disabled: false,
        options: [
          { label: 'Monthly', value: 'Monthly' },
          { label: 'Annual', value: 'Annual' },
          { label: 'Lifetime', value: 'LifeTime' },
          { label: 'One-time', value: 'OneTime' },
          { label: 'Custom', value: 'Custom' },
        ],
      },
    }),
    hasRecurringBilling: Property.StaticDropdown({
      displayName: 'Recurring Billing',
      required: false,
      defaultValue: false,
      width: 'half',
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
    }),
  },
  async run(context) {
    const { mapped } = await chargekeepServices.updateSubscription({ auth: context.auth, input: context.propsValue });
    return mapped();
  },
});
