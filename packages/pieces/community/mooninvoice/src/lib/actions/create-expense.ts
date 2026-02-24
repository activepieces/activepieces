import { createAction, Property } from '@activepieces/pieces-framework';
import { mooninvoiceAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { companyIdProp, contactIdProp } from '../common/props';

export const createExpense = createAction({
  auth: mooninvoiceAuth,
  name: 'createExpense',
  displayName: 'Create Expense',
  description: 'Create a new expense in MoonInvoice',
  props: {
    companyId: companyIdProp,
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Date of Expense (e.g., "2025-02-20")',
      required: true,
    }),
    expenseNumber: Property.ShortText({
      displayName: 'Expense Number',
      description: 'Expense Number',
      required: true,
    }),
    contactId: contactIdProp,
    expenseCost: Property.Number({
      displayName: 'Expense Cost',
      description: 'Cost of Expense',
      required: false,
    }),
    expenseNotes: Property.LongText({
      displayName: 'Expense Notes',
      description: 'Expense Notes',
      required: false,
    }),
    totalAmount: Property.Number({
      displayName: 'Total Amount',
      description: 'Total Amount of Expense',
      required: false,
    }),
    categoryName: Property.ShortText({
      displayName: 'Category Name',
      description: 'Category Name of Expense (e.g., Wages, Supplies, etc.)',
      required: false,
    }),
    paymentType: Property.ShortText({
      displayName: 'Payment Type',
      description: 'Type of Payment (e.g., Visa, Cash, UPI, etc.)',
      required: false,
    }),
    selectedCurrency: Property.ShortText({
      displayName: 'Selected Currency',
      description: 'Currency code like en_IN, en_US etc.',
      required: false,
    }),
    isRecurring: Property.Checkbox({
      displayName: 'Is Recurring',
      description: 'If Expense is recurring',
      required: false,
    }),
    recurringEndDate: Property.ShortText({
      displayName: 'Recurring End Date',
      description: 'End Date of Expense recurring (e.g., "2025-12-31")',
      required: false,
    }),
    recurringIntervalInDay: Property.Number({
      displayName: 'Recurring Interval (Days)',
      description: 'No of Days for Expense recurring',
      required: false,
    }),
    recurringIntervalInString: Property.StaticDropdown({
      displayName: 'Recurring Period',
      description: 'Expense recurring period',
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
    isRoundOff: Property.Checkbox({
      displayName: 'Round Off',
      description: 'Total Amount Round off or not',
      required: false,
    }),
    roundedAmount: Property.Number({
      displayName: 'Rounded Amount',
      description: 'Total Amount Rounded',
      required: false,
    }),
    taxIdJson: Property.LongText({
      displayName: 'Tax IDs (JSON)',
      description:
        'TaxID is an array of Tax IDs. Example: ["1C34BE89-2FC6-48A4-9808-99490F40D3E1", "95A1956E-E60A-4FAC-8EC4-C88EE7431280"]',
      required: false,
    }),
    taxType: Property.Checkbox({
      displayName: 'Tax is Inclusive',
      description: 'If Tax is Inclusive then true otherwise false',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      date,
      expenseNumber,
      contactId,
      expenseCost,
      expenseNotes,
      totalAmount,
      categoryName,
      paymentType,
      selectedCurrency,
      isRecurring,
      recurringEndDate,
      recurringIntervalInDay,
      recurringIntervalInString,
      isRoundOff,
      roundedAmount,
      taxIdJson,
      taxType,
    } = context.propsValue;

    const body: any = {
      CompanyID: companyId,
      Date: date,
      ExpenseNumber: expenseNumber,
      ContactID: contactId,
    };

    if (expenseCost !== undefined && expenseCost !== null)
      body.ExpenseCost = expenseCost;
    if (expenseNotes) body.ExpenseNotes = expenseNotes;
    if (totalAmount !== undefined && totalAmount !== null)
      body.TotalAmount = totalAmount;
    if (categoryName) body.CategoryName = categoryName;
    if (paymentType) body.PaymentType = paymentType;
    if (selectedCurrency) body.SelectedCurrency = selectedCurrency;
    if (isRecurring !== undefined) body.IsRecurring = isRecurring ? 1 : 0;
    if (recurringEndDate) body.RecurringEndDate = recurringEndDate;
    if (recurringIntervalInDay !== undefined && recurringIntervalInDay !== null)
      body.RecurringIntervalInDay = recurringIntervalInDay;
    if (recurringIntervalInString)
      body.RecurringIntervalInString = recurringIntervalInString;
    if (isRoundOff !== undefined) body.IsRoundOff = isRoundOff ? 1 : 0;
    if (roundedAmount !== undefined && roundedAmount !== null)
      body.RoundedAmount = roundedAmount;
    if (taxType !== undefined) body.TaxType = taxType ? 1 : 0;

    // Parse and add tax IDs
    if (taxIdJson) {
      try {
        body.TaxID = JSON.parse(taxIdJson);
      } catch (error) {
        throw new Error('Invalid TaxID JSON format');
      }
    }

    const accessToken = await getAccessToken(
      context.auth.props.email,
      context.auth.props.secret_text
    );

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/create_expense',
      body
    );

    return response;
  },
});
