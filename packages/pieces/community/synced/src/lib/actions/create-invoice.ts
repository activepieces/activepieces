import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { syncedAuth } from '../..';

export const createInvoice = createAction({

  name: 'createInvoice',
  displayName: 'Create Invoice',
  description: 'Create an Invoice in synced',
  auth: syncedAuth,
  props: {
    Id: Property.ShortText({
      displayName: 'Create Invoice ID',
      description: 'Create Invoice ID',
      required: true,
    }),
    InvoiceNumber: Property.ShortText({
      displayName: 'Create Invoice InvoiceNumber',
      description: 'Create Invoice InvoiceNumber',
      required: true,
    }),
    SupplierId: Property.ShortText({
      displayName: 'Create Invoice SupplierId',
      description: 'Create Invoice SupplierId',
      required: true,
    }),
    SupplierName: Property.ShortText({
      displayName: 'Create Invoice SupplierName',
      description: 'Create Invoice SupplierName',
      required: true,
    }),

    SubTotal: Property.ShortText({
      displayName: 'Create Invoice SubTotal',
      description: 'Create Invoice SubTotal',
      required: true,
    }),
    TotalTax: Property.ShortText({
      displayName: 'Create Invoice TotalTax',
      description: 'Create Invoice TotalTax',
      required: true,
    }),
    Date: Property.DateTime({
      displayName: 'Create Invoice Date',
      description: 'Provide YYYY-MM-DD format.',
      required: true,
    }),
    DueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Provide YYYY-MM-DD format.',
      required: true,
    }),
    AmountDue: Property.ShortText({
      displayName: 'Create Invoice AmountDue',
      description: 'Create Invoice AmountDue',
      required: true,
    }),
    Type: Property.ShortText({
      displayName: 'Create Invoice Type',
      description: 'Create Invoice Type',
      required: true,
    }),
    Currency: Property.ShortText({
      displayName: 'Create Invoice Currency',
      description: 'Create Invoice Currency',
      required: true,
    }),
    PdfUrl: Property.ShortText({
      displayName: 'Create Invoice PdfUrl',
      description: 'Create Invoice PdfUrl',
      required: true,
    }),
    Message: Property.Object({
      displayName: 'Create Invoice Message',
      required: true,
      defaultValue: {
        Message: '',
        From: ''
      },
    }),
    IsDuplicate: Property.Checkbox({
      displayName: 'Create Invoice IsDuplicate',
      description: 'Create Invoice IsDuplicate',
      required: false,
    }),
    InvoiceLines: Property.Array({
      displayName: 'Create Invoice InvoiceLines',
      required: false,
      properties: {
        Id: Property.ShortText({
          displayName: 'ID',
          description:  'ID',
          required: true,
        }),
        Description: Property.ShortText({
          displayName: 'Amount',
          required: true,
        }),
        AccountId: Property.ShortText({
          displayName: 'Description',
          required: false,
        }),
        TaxId: Property.ShortText({
          displayName: 'Purchase Order Number',
          required: false,
        }),
        AmountDue: Property.Number({
          displayName: 'Quantity',
          required: false,
        }),
        SubTotal: Property.Number({
          displayName: 'Enter Sub Total',
          required: true,
        }),
        TotalTax: Property.Number({
          displayName: 'Total Tax',
          required: false,
        }),
         Quantity: Property.Number({
          displayName: 'Quantity',
          required: false,
        }),
         TrackingOptions: Property.ShortText({
          displayName: 'Tracking Option List',
          required: false,
        }),
      },
    }),
    PaymentStatus: Property.ShortText({
      displayName: 'Create Invoice PaymentStatus',
      description: 'Create Invoice PaymentStatus',
      required: true,
    }),
    Pairs: Property.ShortText({
      displayName: 'Create Invoice Pairs',
      description: 'Create Invoice Pairs',
      required: true,
    }),
    AccountNumber: Property.ShortText({
      displayName: 'Create Invoice AccountNumber',
      description: 'Create Invoice AccountNumber',
      required: true,
    }),
    BsbNumber: Property.ShortText({
      displayName: 'Create Invoice BsbNumber',
      description: 'Create Invoice BsbNumber',
      required: true,
    }),
    ReferenceId: Property.ShortText({
      displayName: 'Create Invoice ReferenceId',
      description: 'Create Invoice ReferenceId',
      required: true,
    }),
    HasAttachments: Property.Checkbox({
      displayName: 'Create Invoice HasAttachments',
      description: 'Create Invoice HasAttachments',
      required: true,
    }),
    ContactStatus: Property.ShortText({
      displayName: 'Create Invoice ContactStatus',
      description: 'Create Invoice ContactStatus',
      required: true,
    }),
    AccountName: Property.ShortText({
      displayName: 'Create Invoice AccountName',
      description: 'Create Invoice AccountName',
      required: true,
    }),
    AmountCredited: Property.Number({
      displayName: 'Create Invoice AmountCredited',
      description: 'Create Invoice AmountCredited',
      required: true,
    }),
    AmountPaid: Property.Number({
      displayName: 'Create Invoice AmountPaid',
      description: 'Create Invoice AmountPaid',
      required: true,
    }),
    Archived: Property.Checkbox({
      displayName: 'Create Invoice Archived',
      description: 'Create Invoice Archived',
      required: true,
    }),
    Description: Property.ShortText({
      displayName: 'Create Invoice Description',
      description: 'Create Invoice Description',
      required: true,
    }),
    PaidBy: Property.ShortText({
      displayName: 'Create Invoice PaidBy',
      description: 'Create Invoice PaidBy',
      required: true,
    }),
    ExpenseReportId: Property.ShortText({
      displayName: 'Create Invoice ExpenseReportId',
      description: 'Create Invoice ExpenseReportId',
      required: true,
    }),
    ExpenseReportName: Property.ShortText({
      displayName: 'Create Invoice ExpenseReportName',
      description: 'Create Invoice ExpenseReportName',
      required: true,
    }),
    PaymentAccountNumber: Property.ShortText({
      displayName: 'Create Invoice PaymentAccountNumber',
      description: 'Create Invoice PaymentAccountNumber',
      required: true,
    }),
    PaymentDate: Property.ShortText({
      displayName: 'Create Invoice PaymentDate',
      description: 'Create Invoice PaymentDate',
      required: true,
    }),
    EmailId: Property.ShortText({
      displayName: 'Create Invoice EmailId',
      description: 'Create Invoice EmailId',
      required: true,
    }),
    AttachmentId: Property.ShortText({
      displayName: 'Create Invoice AttachmentId',
      description: 'Create Invoice AttachmentId',
      required: true,
    }),
    HexColorClass: Property.ShortText({
      displayName: 'Create Invoice HexColorClass',
      description: 'Create Invoice HexColorClass',
      required: true,
    })
  },
  async run(context) {
    const InvoiceLines = context.propsValue.InvoiceLines as InvoiceLinesInput[];
    const MessageLines = context.propsValue.Message as MessageInput;

       // Message        : MessageLines,

       //   baseUrl: 'https://syncedtestingapi.azurewebsites.net',


    const mbody:any={
        Id              : context.propsValue.Id,
        InvoiceNumber   : context.propsValue.InvoiceNumber,
        SupplierId     : context.propsValue.SupplierId,
        SupplierName   : context.propsValue.SupplierName,
        SubTotal       : context.propsValue.SubTotal,
        TotalTax       : context.propsValue.TotalTax,
        Date           : context.propsValue.Date,
        DueDate        : context.propsValue.DueDate,
        AmountDue      : context.propsValue.AmountDue,
        Type           : context.propsValue.Type,
        Currency       : context.propsValue.Currency,
        PdfUrl         : context.propsValue.PdfUrl,
        Message        : MessageLines,
        IsDuplicate    : context.propsValue.IsDuplicate,
        InvoiceLines   : InvoiceLines,
        PaymentStatus  : context.propsValue.PaymentStatus,
        Pairs          : context.propsValue.Pairs,
        AccountNumber  : context.propsValue.AccountNumber,
        BsbNumber      : context.propsValue.BsbNumber,
        ReferenceId    : context.propsValue.ReferenceId,
        HasAttachments : context.propsValue.HasAttachments,
        ContactStatus  : context.propsValue.ContactStatus,
        AccountName    : context.propsValue.AccountName,
        AmountCredited : context.propsValue.AmountCredited,
        AmountPaid   : context.propsValue.AmountPaid,
        Archived    : context.propsValue.Archived,
        Description : context.propsValue.Description,
        PaidBy  : context.propsValue.PaidBy,
        ExpenseReportId : context.propsValue.ExpenseReportId,
        ExpenseReportName : context.propsValue.ExpenseReportName,
        PaymentAccountNumber: context.propsValue.PaymentAccountNumber,
        PaymentDate : context.propsValue.PaymentDate,
        EmailId : context.propsValue.EmailId,
        AttachmentId : context.propsValue.AttachmentId,
        HexColorClass : context.propsValue.HexColorClass
      };
 console.log("response data print",mbody)
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://syncedtestingapi.azurewebsites.net/api/Invoices/createInvoiceByKey',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': context.auth,
      },
      body:mbody,
    });

    console.log("response data print",response.body)
    return response.body;
  },
});

type InvoiceLinesInput = {
  Id: string;
  Description: string;
  AccountId: string;
  TaxId: string;
  AmountDue: number;
  SubTotal: number;
  TotalTax: number;
  Quantity: number;
  TrackingOptions: string;
};

type MessageInput = {
  Message: string;
  From: string;
};
