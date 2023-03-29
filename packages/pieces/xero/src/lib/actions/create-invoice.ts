import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework";
import { props } from "../common/props";
import dayjs from "dayjs";

export const xeroCreateInvoice = createAction({
  name: 'xero_create_invoice',
  description: 'Create Xero Invoice',
  displayName: 'Create or Update Invoice',
  sampleData: {
    "Id": "16693b0a-bc43-4e20-9f2c-114dd48b469b",
    "Status": "OK",
    "ProviderName": "ActivePie",
    "DateTimeUTC": "/Date(1679982403282)/",
    "Invoices": [
      {
        "Type": "ACCREC",
        "InvoiceID": "dd0f3411-c57d-41dd-8651-37737f56cf67",
        "InvoiceNumber": "INV-0001",
        "Reference": "GHHGC743237",
        "Prepayments": [],
        "Overpayments": [],
        "AmountDue": 200,
        "AmountPaid": 0,
        "SentToContact": false,
        "CurrencyRate": 1,
        "IsDiscounted": false,
        "HasErrors": false,
        "InvoicePaymentServices": [],
        "Contact": {
          "ContactID": "e595b89d-347e-447d-a859-ee03340ec88d",
          "ContactStatus": "ACTIVE",
          "Name": "DSAP",
          "EmailAddress": "dq@example.com",
          "BankAccountDetails": "",
          "Addresses": [
            {
              "AddressType": "STREET",
              "City": "",
              "Region": "",
              "PostalCode": "",
              "Country": ""
            },
            {
              "AddressType": "POBOX",
              "City": "",
              "Region": "",
              "PostalCode": "",
              "Country": ""
            }
          ],
          "Phones": [
            {
              "PhoneType": "DEFAULT",
              "PhoneNumber": "",
              "PhoneAreaCode": "",
              "PhoneCountryCode": ""
            },
            {
              "PhoneType": "DDI",
              "PhoneNumber": "",
              "PhoneAreaCode": "",
              "PhoneCountryCode": ""
            },
            {
              "PhoneType": "FAX",
              "PhoneNumber": "",
              "PhoneAreaCode": "",
              "PhoneCountryCode": ""
            },
            {
              "PhoneType": "MOBILE",
              "PhoneNumber": "",
              "PhoneAreaCode": "",
              "PhoneCountryCode": ""
            }
          ],
          "UpdatedDateUTC": "/Date(1679982402187+0000)/",
          "ContactGroups": [],
          "IsSupplier": false,
          "IsCustomer": true,
          "SalesTrackingCategories": [],
          "PurchasesTrackingCategories": [],
          "ContactPersons": [],
          "HasValidationErrors": false
        },
        "DateString": "2023-03-04T00:00:00",
        "Date": "/Date(1677888000000+0000)/",
        "DueDateString": "2023-03-18T00:00:00",
        "DueDate": "/Date(1679097600000+0000)/",
        "BrandingThemeID": "4b3fdee3-c068-4121-a348-db3b4b7934d9",
        "Status": "SUBMITTED",
        "LineAmountTypes": "Exclusive",
        "LineItems": [
          {
            "Description": "Description",
            "UnitAmount": 200,
            "TaxType": "NONE",
            "TaxAmount": 0,
            "LineAmount": 200,
            "AccountCode": "200",
            "Tracking": [],
            "Quantity": 1,
            "LineItemID": "43331784-c61d-4a56-8488-312b76f5c705",
            "ValidationErrors": []
          }
        ],
        "SubTotal": 200,
        "TotalTax": 0,
        "Total": 200,
        "UpdatedDateUTC": "/Date(1679982403190+0000)/",
        "CurrencyCode": "KES"
      }
    ]
  },
  props: {
    authentication: props.authentication,
    tenant_id: props.tenant_id,
    invoice_id: props.invoice_id,
    contact_id: props.contact_id(true),
    line_item: Property.Object({
      displayName: "Line Item",
      description: "Invoice line items",
      required: false,
      defaultValue: {
        AccountCode: 200,
        Quantity: 0,
        UnitAmount: 0,
        LineAmount: 0,
        TaxType: "NONE",
        Description: "",
      }
    }),
    date: Property.ShortText({
      displayName: "Date Prepared",
      description: "Date the invoice was created. Format example: 2019-03-11",
      required: true,
      defaultValue: dayjs().format('YYYY-MM-DD')
    }),
    due_date: Property.ShortText({
      displayName: "Due Date",
      description: "Due date of the invoice. Format example: 2019-03-11",
      required: true
    }),
    reference: Property.ShortText({
      displayName: "Invoice Reference",
      description: "Reference number of the Invoice",
      required: true
    }),
    status: Property.StaticDropdown({
      displayName: "Status",
      description: "Invoice Status",
      required: true,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Deleted', value: 'DELETED' },
          { label: 'Voided', value: 'VOIDED' },
        ]
      }
    })
  },
  async run(context) {
    const { invoice_id, contact_id, tenant_id, ...invoice } = context.propsValue

    const body = {
      Invoices: [{
        Type: "ACCREC",
        Contact: {
          ContactID: contact_id
        },
        LineItems: invoice.line_item ? [invoice.line_item] : [],
        Date: invoice.date,
        DueDate: invoice.due_date,
        Reference: invoice.reference,
        Status: invoice.status
      }]
    }

    const url = 'https://api.xero.com/api.xro/2.0/Invoices'
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: invoice_id ? `${url}/${invoice_id}` : url,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication.access_token
      },
      headers: {
        'Xero-Tenant-Id': tenant_id
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Invoice creation response", result)

    if (result.status === 200) {
      return result.body
    }

    return result
  }
});
