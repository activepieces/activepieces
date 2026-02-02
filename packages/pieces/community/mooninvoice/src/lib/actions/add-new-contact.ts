import { createAction, Property } from '@activepieces/pieces-framework';
import { mooninvoiceAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { companyIdProp } from '../common/props';

export const addNewContact = createAction({
  auth: mooninvoiceAuth,
  name: 'addNewContact',
  displayName: 'Add New Contact',
  description: 'Add a new contact to a company in MoonInvoice',
  props: {
    companyId:companyIdProp,
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Name of Organization/Company',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First Name of Contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last Name of Contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of Contact person',
      required: false,
    }),
    mobileNo: Property.ShortText({
      displayName: 'Mobile Number',
      description: 'Mobile No. of Contact person',
      required: false,
    }),
    businessNo: Property.ShortText({
      displayName: 'Business Number',
      description: 'Business Ph No. of Contact person',
      required: false,
    }),
    homeNo: Property.ShortText({
      displayName: 'Home Number',
      description: 'Home Ph No. of Contact person',
      required: false,
    }),
    vatNo: Property.ShortText({
      displayName: 'VAT Number',
      description: 'VAT No. of Contact',
      required: false,
    }),
    regNo: Property.ShortText({
      displayName: 'Registration Number',
      description: 'Registration No.',
      required: false,
    }),
    faxNo: Property.ShortText({
      displayName: 'Fax Number',
      description: 'Fax No.',
      required: false,
    }),
    internalNotes: Property.LongText({
      displayName: 'Internal Notes',
      description: 'Internal Notes of Contact',
      required: false,
    }),
    hourlyRate: Property.Number({
      displayName: 'Hourly Rate',
      description: 'Hourly Rate of Contact person',
      required: false,
    }),
    currencyCode: Property.ShortText({
      displayName: 'Currency Code',
      description: 'Currency code like INR, USD, CAD etc.',
      required: false,
    }),
    statusCustomer: Property.Checkbox({
      displayName: 'Is Customer',
      description: 'If Contact is customer',
      required: false,
    }),
    statusVendor: Property.Checkbox({
      displayName: 'Is Vendor',
      description: 'If Contact is vendor',
      required: false,
    }),
    paymentReminder: Property.Checkbox({
      displayName: 'Payment Reminder',
      description: 'Enable payment reminder',
      required: false,
    }),
    billingAddressStreet1: Property.ShortText({
      displayName: 'Billing Address Street 1',
      description: 'Billing Address Street1 of Contact person',
      required: false,
    }),
    billingAddressStreet2: Property.ShortText({
      displayName: 'Billing Address Street 2',
      description: 'Billing Address Street2 of Contact person',
      required: false,
    }),
    billingAddressCity: Property.ShortText({
      displayName: 'Billing Address City',
      description: 'Billing Address City of Contact person',
      required: false,
    }),
    billingAddressState: Property.ShortText({
      displayName: 'Billing Address State',
      description: 'Billing Address State of Contact person',
      required: false,
    }),
    billingAddressCountry: Property.ShortText({
      displayName: 'Billing Address Country',
      description: 'Billing Address Country of Contact person',
      required: false,
    }),
    billingAddressZip: Property.ShortText({
      displayName: 'Billing Address Zip',
      description: 'Billing Address Zip of Contact person',
      required: false,
    }),
    shippingAddressStreet1: Property.ShortText({
      displayName: 'Shipping Address Street 1',
      description: 'Shipping Address Street1 of Contact person',
      required: false,
    }),
    shippingAddressStreet2: Property.ShortText({
      displayName: 'Shipping Address Street 2',
      description: 'Shipping Address Street2 of Contact person',
      required: false,
    }),
    shippingAddressCity: Property.ShortText({
      displayName: 'Shipping Address City',
      description: 'Shipping Address City of Contact person',
      required: false,
    }),
    shippingAddressState: Property.ShortText({
      displayName: 'Shipping Address State',
      description: 'Shipping Address State of Contact person',
      required: false,
    }),
    shippingAddressCountry: Property.ShortText({
      displayName: 'Shipping Address Country',
      description: 'Shipping Address Country of Contact person',
      required: false,
    }),
    shippingAddressZip: Property.ShortText({
      displayName: 'Shipping Address Zip',
      description: 'Shipping Address Zip of Contact person',
      required: false,
    }),
    paymentTerms: Property.Number({
      displayName: 'Payment Terms (Days)',
      description:
        'Payment terms must be 7, 10, 15, 30, 60, 90, or 180 days only',
      required: false,
    }),
    openingBalance: Property.Number({
      displayName: 'Opening Balance',
      description: 'Opening Balance of Contact',
      required: false,
    }),
    openingBalanceDate: Property.ShortText({
      displayName: 'Opening Balance Date',
      description: 'Opening Balance Date in format: "2025-1-8 15:9:40"',
      required: false,
    }),
    bankDetails: Property.LongText({
      displayName: 'Bank Details',
      description:
        'Bank details in format: "Account No: 78452356\\nAccount Holder Name: Abby Hamill\\nBranch Name: ABC"',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      organization,
      firstName,
      lastName,
      email,
      mobileNo,
      businessNo,
      homeNo,
      vatNo,
      regNo,
      faxNo,
      internalNotes,
      hourlyRate,
      currencyCode,
      statusCustomer,
      statusVendor,
      paymentReminder,
      billingAddressStreet1,
      billingAddressStreet2,
      billingAddressCity,
      billingAddressState,
      billingAddressCountry,
      billingAddressZip,
      shippingAddressStreet1,
      shippingAddressStreet2,
      shippingAddressCity,
      shippingAddressState,
      shippingAddressCountry,
      shippingAddressZip,
      paymentTerms,
      openingBalance,
      openingBalanceDate,
      bankDetails,
    } = context.propsValue;

    const body: any = {
      CompanyID: companyId,
    };

    if (organization) body.Organization = organization;
    if (firstName) body.FirstName = firstName;
    if (lastName) body.LastName = lastName;
    if (email) body.Email = email;
    if (mobileNo) body.MobileNo = mobileNo;
    if (businessNo) body.BusinessNo = businessNo;
    if (homeNo) body.HomeNo = homeNo;
    if (vatNo) body.VatNo = vatNo;
    if (regNo) body.RegNo = regNo;
    if (faxNo) body.FaxNo = faxNo;
    if (internalNotes) body.InternalNotes = internalNotes;
    if (hourlyRate !== undefined && hourlyRate !== null)
      body.HourlyRate = hourlyRate;
    if (currencyCode) body.CurrencyCode = currencyCode;
    if (statusCustomer !== undefined)
      body.StatusCustomer = statusCustomer ? 1 : 0;
    if (statusVendor !== undefined) body.StatusVendor = statusVendor ? 1 : 0;
    if (paymentReminder !== undefined)
      body.PaymentReminder = paymentReminder ? 1 : 0;
    if (billingAddressStreet1)
      body.BillingAddressStreet1 = billingAddressStreet1;
    if (billingAddressStreet2)
      body.BillingAddressStreet2 = billingAddressStreet2;
    if (billingAddressCity) body.BillingAddressCity = billingAddressCity;
    if (billingAddressState) body.BillingAddressState = billingAddressState;
    if (billingAddressCountry)
      body.BillingAddressCountry = billingAddressCountry;
    if (billingAddressZip) body.BillingAddressZip = billingAddressZip;
    if (shippingAddressStreet1)
      body.ShippingAddressStreet1 = shippingAddressStreet1;
    if (shippingAddressStreet2)
      body.ShippingAddressStreet2 = shippingAddressStreet2;
    if (shippingAddressCity) body.ShippingAddressCity = shippingAddressCity;
    if (shippingAddressState) body.ShippingAddressState = shippingAddressState;
    if (shippingAddressCountry)
      body.ShippingAddressCountry = shippingAddressCountry;
    if (shippingAddressZip) body.ShippingAddressZip = shippingAddressZip;
    if (paymentTerms !== undefined && paymentTerms !== null)
      body.PaymentTerms = paymentTerms;
    if (openingBalance !== undefined && openingBalance !== null)
      body.OpeningBalance = openingBalance;
    if (openingBalanceDate) body.OpeningBalanceDate = openingBalanceDate;
    if (bankDetails) body.BankDetails = bankDetails;

    const accessToken = await getAccessToken(
      context.auth.props.email,
      context.auth.props.secret_text
    );
    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/add_contact',
      body
    );

    return response;
  },
});
