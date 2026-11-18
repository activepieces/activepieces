import { createAction, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepOutputSchemas } from '../common/output-schemas';
import { chargekeepServices } from '../common/services';

export const addOrUpdateSubscription = createAction({
  name: 'addOrUpdateSubscription',
  classification: 'WRITE',
  displayName: 'Add or Update Subscription',
  description: 'Adds a product subscription to a contact, or replaces the existing one for that product.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates or replaces a product subscription for one contact in the ChargeKeep/Sperse CRM. Identify the contact by contactId (number) or contactXref (your external ID); give the productCode (SKU) of an existing subscription product and a paymentPeriodType that the product offers (Monthly, Annual, LifeTime, OneTime, Custom). Does not charge a card. Running it again for the same contact and product replaces that subscription (new subscription ID, start date reset) instead of adding a second one. Returns the contact ID and the resulting subscription.',
    idempotent: false,
  },
  outputSchema: chargekeepOutputSchemas.subscriptionUpdate,
  auth: chargekeepAuth,
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'ChargeKeep contact ID. Required unless External Contact ID is set.',
      required: false,
    }),
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'Optional. Product Code is used to find the product.',
      required: false,
    }),
    contactXref: Property.ShortText({
      displayName: 'External Contact ID',
      description: 'Your external reference (XREF) for the contact. Required unless Contact ID is set.',
      required: false,
    }),
    productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Product Code (SKU) of an existing subscription product.',
      required: true,
    }),
    paymentPeriodType: Property.StaticDropdown({
      displayName: 'Payment Period Type',
      description: 'The chosen Period Type has to be set for the Product on the ChargeKeep side.',
      required: true,
      defaultValue: 'Monthly',
      options: {
        disabled: false,
        options: [
          { label: 'Monthly', value: 'Monthly' },
          { label: 'Annual', value: 'Annual' },
          { label: 'LifeTime', value: 'LifeTime' },
          { label: 'OneTime', value: 'OneTime' },
          { label: 'Custom', value: 'Custom' },
        ],
      },
    }),
    hasRecurringBilling: Property.StaticDropdown({
      displayName: 'Is it Recurring Billing',
      required: false,
      defaultValue: false,
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
