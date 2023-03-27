import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework";

export const xeroCreateInvoice = createAction({
  name: 'xero_create_invoice',
  description: 'Create Xero Invoice',
  displayName: 'Create or Update Invoice',
  sampleData: {
    "Invoices": [{
      "Type": "ACCREC", 
      "Contact": {
        "ContactID":
          "430fa14a-f945-44d3-9f97-5df5e28441b8"
      }, 
      "LineItems": [{
        "Description": "Acme Tires", 
        "Quantity": 2, 
        "UnitAmount": 20,
        "AccountCode": "200", 
        "TaxType": "NONE", 
        "LineAmount": 40
      }],
      "Date": "2019-03-11", 
      "DueDate": "2018-12-10", 
      "Reference": "Website Design", 
      "Status": "AUTHORISED"
    }]
  },
  props: {
    authentication: Property.OAuth2({
      description: "",
      displayName: 'Authentication',
      authUrl: "https://app.clickup.com/api",
      tokenUrl: "https://app.clickup.com/api/v2/oauth/token",
      required: true,
      scope: [
        'accounting.contacts'
      ]
    }),
    invoice_id: Property.ShortText({
      displayName: "Invoice ID",
      description: "ID of the invoice to update",
      required: false
    }),
    contact_id: Property.ShortText({
      displayName: "Contact ID",
      description: "ID of the contact to create invoice for.",
      required: true
    }),
    line_item: Property.Object({
      displayName: "Line Item",
      description: "Invoice line items",
      required: true,
      defaultValue: {
        Description: undefined, 
        Quantity: 0,
        UnitAmount: 0,
        AccountCode: undefined, 
        TaxType: "NONE", 
        LineAmount: 0
      }
    }),
    date: Property.ShortText({
      displayName: "Date Prepared",
      description: "Date the invoice was created. Format example: 2019-03-11",
      required: true
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
          {label: 'Draft', value: 'DRAFT'	},
          {label: 'Submitted', value: 'SUBMITTED'},
          {label: 'Authorised', value: 'AUTHORISED'},
          {label: 'Submitted', value: 'SUBMITTED'},
          {label: 'Deleted', value: 'DELETED'},
          {label: 'Voided', value: 'VOIDED'},
        ]
      }
    })
  },
  async run(context) {
    const { invoice_id, contact_id, ...invoice } = context.propsValue

    const body = {
      Invoices: [{
        Type: "ACCREC", 
        Contact: {
          ContactID: contact_id
        }, 
        LineItems: [invoice.line_item],
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
