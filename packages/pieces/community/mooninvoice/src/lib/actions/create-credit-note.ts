import { createAction, Property } from '@activepieces/pieces-framework';
import { mooninvoiceAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { companyIdProp, contactIdProp } from '../common/props';

export const createCreditNote = createAction({
  auth: mooninvoiceAuth,
  name: 'createCreditNote',
  displayName: 'Create Credit Note',
  description: 'Create a new credit note in MoonInvoice',
  props: {
    companyId: companyIdProp,
    contactId: contactIdProp,
    creditNotesNumber: Property.ShortText({
      displayName: 'Credit Note Number',
      description: 'Credit Note Number',
      required: true,
    }),
    entryDate: Property.ShortText({
      displayName: 'Entry Date',
      description: 'Entry Date of Credit Note (e.g., "2025-02-20")',
      required: true,
    }),
    creditNotesHeader: Property.ShortText({
      displayName: 'Credit Note Header',
      description: 'Title or Header of Credit Note',
      required: false,
    }),
    creditNotesTerms: Property.LongText({
      displayName: 'Credit Note Terms',
      description: 'Terms of Credit Note',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes/Description of Credit Note',
      required: false,
    }),
    selectedCurrency: Property.ShortText({
      displayName: 'Selected Currency',
      description: 'Currency code like en_IN, en_US etc.',
      required: false,
    }),
    discountBeforeTax: Property.Checkbox({
      displayName: 'Discount Before Tax',
      description: 'Discount applied before tax',
      required: false,
    }),
    isRoundOff: Property.Checkbox({
      displayName: 'Round Off',
      description: 'Round off the final amount',
      required: false,
    }),
    roundedAmount: Property.Number({
      displayName: 'Rounded Amount',
      description: 'Rounded amount value',
      required: false,
    }),
    percentage: Property.Number({
      displayName: 'Discount Percentage',
      description: 'Discount percentage from total amount',
      required: false,
    }),
    billingStreet1: Property.ShortText({
      displayName: 'Billing Address Street 1',
      description: 'Billing Address Street1',
      required: false,
    }),
    billingStreet2: Property.ShortText({
      displayName: 'Billing Address Street 2',
      description: 'Billing Address Street2',
      required: false,
    }),
    billingCity: Property.ShortText({
      displayName: 'Billing Address City',
      description: 'Billing Address City',
      required: false,
    }),
    billingState: Property.ShortText({
      displayName: 'Billing Address State',
      description: 'Billing Address State',
      required: false,
    }),
    billingCountry: Property.ShortText({
      displayName: 'Billing Address Country',
      description: 'Billing Address Country',
      required: false,
    }),
    billingZip: Property.ShortText({
      displayName: 'Billing Address Zip',
      description: 'Billing Address Zip',
      required: false,
    }),
    shippingStreet1: Property.ShortText({
      displayName: 'Shipping Address Street 1',
      description: 'Shipping Address Street1',
      required: false,
    }),
    shippingStreet2: Property.ShortText({
      displayName: 'Shipping Address Street 2',
      description: 'Shipping Address Street2',
      required: false,
    }),
    shippingCity: Property.ShortText({
      displayName: 'Shipping Address City',
      description: 'Shipping Address City',
      required: false,
    }),
    shippingState: Property.ShortText({
      displayName: 'Shipping Address State',
      description: 'Shipping Address State',
      required: false,
    }),
    shippingCountry: Property.ShortText({
      displayName: 'Shipping Address Country',
      description: 'Shipping Address Country',
      required: false,
    }),
    shippingZip: Property.ShortText({
      displayName: 'Shipping Address Zip',
      description: 'Shipping Address Zip',
      required: false,
    }),
    productDataJson: Property.LongText({
      displayName: 'Product Data (JSON)',
      description:
        'Product Data as JSON array. Each item should contain: ProductName, HSNCode, Quantity, UnitCost, ProductNotes, ProductID, Total, SubAmount, DiscountIsPercentage, ProductType, DiscountValue, TaxID (array), TaxType',
      required: false,
    }),
    taskDataJson: Property.LongText({
      displayName: 'Task Data (JSON)',
      description:
        'Task Data as JSON array. Each item should contain: TaskName, Hours, TaskRate, TimeNotes, TaskID, Total, DiscountIsPercentage, TaskType, DiscountValue, TaxID (array), TaxType',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      contactId,
      creditNotesNumber,
      entryDate,
      creditNotesHeader,
      creditNotesTerms,
      notes,
      selectedCurrency,
      discountBeforeTax,
      isRoundOff,
      roundedAmount,
      percentage,
      billingStreet1,
      billingStreet2,
      billingCity,
      billingState,
      billingCountry,
      billingZip,
      shippingStreet1,
      shippingStreet2,
      shippingCity,
      shippingState,
      shippingCountry,
      shippingZip,
      productDataJson,
      taskDataJson,
    } = context.propsValue;

    const body: any = {
      CompanyID: companyId,
      ContactID: contactId,
      CreditNotesNumber: creditNotesNumber,
      EntryDate: entryDate,
    };

    if (creditNotesHeader) body.CreditNotesHeader = creditNotesHeader;
    if (creditNotesTerms) body.CreditNotesTerms = creditNotesTerms;
    if (notes) body.Notes = notes;
    if (selectedCurrency) body.SelectedCurrency = selectedCurrency;
    if (discountBeforeTax !== undefined)
      body.DiscountBeforeTax = discountBeforeTax;

    // Build CreditNotesFolder object
    const creditNotesFolder: any = {
      isroundoff: isRoundOff ? 1 : 0,
    };
    if (roundedAmount !== undefined && roundedAmount !== null)
      creditNotesFolder.rounded_amount = roundedAmount;
    if (percentage !== undefined && percentage !== null)
      creditNotesFolder.Percentage = percentage;

    // Add billing address
    if (
      billingStreet1 ||
      billingStreet2 ||
      billingCity ||
      billingState ||
      billingCountry ||
      billingZip
    ) {
      creditNotesFolder.Billing_Add = {
        Street1: billingStreet1 || '',
        Street2: billingStreet2 || '',
        City: billingCity || '',
        State: billingState || '',
        Country: billingCountry || '',
        Zip: billingZip || '',
      };
    }

    // Add shipping address
    if (
      shippingStreet1 ||
      shippingStreet2 ||
      shippingCity ||
      shippingState ||
      shippingCountry ||
      shippingZip
    ) {
      creditNotesFolder.Secondary_Add = {
        Street1: shippingStreet1 || '',
        Street2: shippingStreet2 || '',
        City: shippingCity || '',
        State: shippingState || '',
        Country: shippingCountry || '',
        Zip: shippingZip || '',
      };
    }

    body.CreditNotesFolder = JSON.stringify(creditNotesFolder);

    // Parse and add product data
    if (productDataJson) {
      try {
        body.ProductData = JSON.parse(productDataJson);
      } catch (error) {
        throw new Error('Invalid ProductData JSON format');
      }
    }

    // Parse and add task data
    if (taskDataJson) {
      try {
        body.TaskData = JSON.parse(taskDataJson);
      } catch (error) {
        throw new Error('Invalid TaskData JSON format');
      }
    }

    const accessToken = await getAccessToken(
      context.auth.props.email,
      context.auth.props.secret_text
    );

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/create_credit_notes',
      body
    );

    return response;
  },
});
