import { createAction, Property } from '@activepieces/pieces-framework';
import { mooninvoiceAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { companyIdProp, contactIdProp } from '../common/props';

export const createInvoice = createAction({
  auth: mooninvoiceAuth,
  name: 'createInvoice',
  displayName: 'Create Invoice',
  description: 'Create a new invoice in MoonInvoice',
  props: {
    companyId: companyIdProp,
    contactId: contactIdProp  ,
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Invoice Number',
      required: true,
    }),
    entryDate: Property.ShortText({
      displayName: 'Entry Date',
      description: 'Entry Date of Invoice (e.g., "2025-02-20")',
      required: true,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Payment Due Date of Invoice (e.g., "2025-03-20")',
      required: true,
    }),
    invoiceHeader: Property.ShortText({
      displayName: 'Invoice Header',
      description: 'Title or Header of Invoice',
      required: false,
    }),
    terms: Property.LongText({
      displayName: 'Terms',
      description: 'Terms of Invoice',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes/Description of Invoice',
      required: false,
    }),
    selectedCurrency: Property.ShortText({
      displayName: 'Selected Currency',
      description: 'Currency code like en_IN, en_US etc.',
      required: false,
    }),
    shippingCost: Property.Number({
      displayName: 'Shipping Cost',
      description: 'Shipping Cost of Invoice',
      required: false,
    }),
    shippingMethod: Property.ShortText({
      displayName: 'Shipping Method',
      description: 'Shipping Method of Invoice',
      required: false,
    }),
    poNo: Property.ShortText({
      displayName: 'PO Number',
      description: 'PO No of Invoice',
      required: false,
    }),
    discountAmount: Property.Number({
      displayName: 'Discount Amount',
      description: 'Discount Amount on invoice total',
      required: false,
    }),
    discountBeforeTax: Property.Checkbox({
      displayName: 'Discount Before Tax',
      description: 'Discount applied before tax',
      required: false,
    }),
    depositeAmount: Property.Number({
      displayName: 'Deposite Amount',
      description: 'Deposite Amount of Invoice',
      required: false,
    }),
    amountDue: Property.Number({
      displayName: 'Amount Due',
      description: 'Remaining Payment Amount of Invoice',
      required: false,
    }),
    amountPaid: Property.Number({
      displayName: 'Amount Paid',
      description: 'Total Paid Amount of Invoice',
      required: false,
    }),
    totalAmount: Property.Number({
      displayName: 'Total Amount',
      description: 'Total Amount of Invoice',
      required: false,
    }),
    subTotal: Property.Number({
      displayName: 'Sub Total',
      description: 'Sub Total Amount of Invoice',
      required: false,
    }),
    isRecurring: Property.Checkbox({
      displayName: 'Is Recurring',
      description: 'If Invoice is recurring',
      required: false,
    }),
    recurringEndDate: Property.ShortText({
      displayName: 'Recurring End Date',
      description: 'End Date of Invoice recurring (e.g., "2025-12-31")',
      required: false,
    }),
    recurringIntervalInString: Property.StaticDropdown({
      displayName: 'Recurring Period',
      description: 'Invoice recurring period',
      required: false,
      options: {
        options: [
          { label: 'Daily', value: 'Daily' },
          { label: 'Weekly', value: 'Weekly' },
          { label: 'Fortnightly', value: 'Fortnightly' },
          { label: 'Monthly', value: 'Monthly' },
          { label: 'Bi-Monthly', value: 'BiMonthly' },
          { label: 'Quarterly', value: 'Quarterly' },
          { label: '6 Months', value: '6-Months' },
          { label: 'Annually', value: 'Annually' },
          { label: '2 Years', value: '2-Years' },
        ],
      },
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
    paymentMethodsJson: Property.LongText({
      displayName: 'Payment Methods (JSON)',
      description:
        'PaymentMethods is array and contains Payment Method IDs. Example: ["3A72C3BF-1B42-4A62-9E8E-5C4178E07D2F", "D89F53D9-7E01-4438-88BD-74D9C4101D7C"]',
      required: false,
    }),
    productDataJson: Property.LongText({
      displayName: 'Product Data (JSON)',
      description:
        'Product Data as JSON array. Each item: ProductName, Quantity, UnitCost, ProductNotes, ProductID, Total, SubAmount, DiscountIsPercentage, ProductType, DiscountValue, TaxID (array), TaxType',
      required: false,
    }),
    taskDataJson: Property.LongText({
      displayName: 'Task Data (JSON)',
      description:
        'Task Data as JSON array. Each item: TaskName, Hours, TaskRate, TimeNotes, TaskID, Total, DiscountIsPercentage, TaskType, DiscountValue, TaxID (array), TaxType',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      contactId,
      invoiceNumber,
      entryDate,
      dueDate,
      invoiceHeader,
      terms,
      notes,
      selectedCurrency,
      shippingCost,
      shippingMethod,
      poNo,
      discountAmount,
      discountBeforeTax,
      depositeAmount,
      amountDue,
      amountPaid,
      totalAmount,
      subTotal,
      isRecurring,
      recurringEndDate,
      recurringIntervalInString,
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
      paymentMethodsJson,
      productDataJson,
      taskDataJson,
    } = context.propsValue;

    const body: any = {
      CompanyID: companyId,
      ContactID: contactId,
      InvoiceNumber: invoiceNumber,
      EntryDate: entryDate,
      DueDate: dueDate,
    };

    if (invoiceHeader) body.InvoiceHeader = invoiceHeader;
    if (terms) body.Terms = terms;
    if (notes) body.Notes = notes;
    if (selectedCurrency) body.SelectedCurrency = selectedCurrency;
    if (shippingCost !== undefined && shippingCost !== null)
      body.ShippingCost = shippingCost;
    if (shippingMethod) body.ShippingMethod = shippingMethod;
    if (poNo) body.PoNo = poNo;
    if (discountAmount !== undefined && discountAmount !== null)
      body.DiscountAmount = discountAmount;
    if (discountBeforeTax !== undefined)
      body.DiscountBeforeTax = discountBeforeTax;
    if (depositeAmount !== undefined && depositeAmount !== null)
      body.DepositeAmount = depositeAmount;
    if (amountDue !== undefined && amountDue !== null)
      body.AmountDue = amountDue;
    if (amountPaid !== undefined && amountPaid !== null)
      body.AmountPaid = amountPaid;
    if (totalAmount !== undefined && totalAmount !== null)
      body.TotalAmount = totalAmount;
    if (subTotal !== undefined && subTotal !== null) body.SubTotal = subTotal;
    if (isRecurring !== undefined) body.IsRecurring = isRecurring ? 1 : 0;
    if (recurringEndDate) body.RecurringEndDate = recurringEndDate;
    if (recurringIntervalInString)
      body.RecurringIntervalInString = recurringIntervalInString;

    // Build billing address
    if (
      billingStreet1 ||
      billingStreet2 ||
      billingCity ||
      billingState ||
      billingCountry ||
      billingZip
    ) {
      body.Billing_Add = {
        Street1: billingStreet1 || '',
        Street2: billingStreet2 || '',
        City: billingCity || '',
        State: billingState || '',
        Country: billingCountry || '',
        Zip: billingZip || '',
      };
    }

    // Build shipping address
    if (
      shippingStreet1 ||
      shippingStreet2 ||
      shippingCity ||
      shippingState ||
      shippingCountry ||
      shippingZip
    ) {
      body.Secondary_Add = {
        Street1: shippingStreet1 || '',
        Street2: shippingStreet2 || '',
        City: shippingCity || '',
        State: shippingState || '',
        Country: shippingCountry || '',
        Zip: shippingZip || '',
      };
    }

    // Parse and add payment methods
    if (paymentMethodsJson) {
      try {
        body.PaymentMethods = JSON.parse(paymentMethodsJson);
      } catch (error) {
        throw new Error('Invalid PaymentMethods JSON format');
      }
    }

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
      '/create_invoice',
      body
    );

    return response;
  },
});
