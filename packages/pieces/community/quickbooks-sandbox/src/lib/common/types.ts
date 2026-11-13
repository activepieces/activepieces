export type QuickbooksAuthValue = {
    access_token: string;
    props?: Record<string, unknown>;
};

export interface QuickbooksLinkedTxn {
    TxnId: string;
    TxnType: string;
}

export interface QuickbooksTaxLine {
    DetailType: string;
    Amount?: number;
    TaxLineDetail?: {
        TaxRateRef?: QuickbooksRef;
        PercentBased?: boolean;
        TaxPercent?: number;
        NetAmountTaxable?: number;
    };
}

export interface QuickbooksRef {
    value: string;
    name?: string;
}

export interface QuickbooksAddress {
    Id?: string;
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Lat?: string;
    Long?: string;
}

export interface QuickbooksEmail {
    Address?: string;
}

export interface QuickbooksWebsite {
    URI?: string;
}

export interface QuickbooksPhoneNumber {
    FreeFormNumber?: string;
}

export interface QuickbooksCurrencyRef {
    value: string;
    name?: string;
}

export interface QuickbooksMetaData {
    CreateTime?: string;
    LastUpdatedTime?: string;
}

export interface QuickbooksCustomField {
    DefinitionId: string;
    Name?: string;
    Type: 'BooleanType' | 'DateType' | 'NumberType' | 'StringType';
    StringValue?: string;
    BooleanValue?: boolean;
    DateValue?: string;
    NumberValue?: number;
}

export interface QuickbooksCustomer {
    Id: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    GivenName?: string;
    FamilyName?: string;
    FullyQualifiedName?: string;
    CompanyName?: string;
    DisplayName: string;
    PrintOnCheckName?: string;
    Active?: boolean;
    PrimaryPhone?: QuickbooksPhoneNumber;
    PrimaryEmailAddr?: QuickbooksEmail;
    WebAddr?: QuickbooksWebsite;
    BillAddr?: QuickbooksAddress;
    ShipAddr?: QuickbooksAddress;
    Job?: boolean;
    BillWithParent?: boolean;
    ParentRef?: QuickbooksRef;
    Level?: number;
    SalesTermRef?: QuickbooksRef;
    PaymentMethodRef?: QuickbooksRef;
    Balance?: number;
    OpenBalanceDate?: string;
    BalanceWithJobs?: number;
    CurrencyRef?: QuickbooksCurrencyRef;
    PreferredDeliveryMethod?: string;
    Taxable?: boolean;
    TaxExemptionReasonId?: QuickbooksRef;
    DefaultTaxCodeRef?: QuickbooksRef;
    Notes?: string;
    domain?: string;
    sparse?: boolean;
}

export interface QuickbooksInvoice {
    Id: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    CustomField?: QuickbooksCustomField[];
    DocNumber?: string;
    TxnDate?: string;
    CurrencyRef?: QuickbooksCurrencyRef;
    LinkedTxn?: QuickbooksLinkedTxn[];
    Line: QuickbooksInvoiceLine[];
    TxnTaxDetail?: { TotalTax?: number; TaxLine?: QuickbooksTaxLine[] };
    CustomerRef: QuickbooksRef;
    CustomerMemo?: { value: string };
    BillAddr?: QuickbooksAddress;
    ShipAddr?: QuickbooksAddress;
    SalesTermRef?: QuickbooksRef;
    DueDate?: string;
    TotalAmt: number;
    ApplyTaxAfterDiscount?: boolean;
    PrintStatus?: string;
    EmailStatus?: string;
    BillEmail?: QuickbooksEmail;
    Balance: number;
    Deposit?: number;
    AllowIPNPayment?: boolean;
    AllowOnlinePayment?: boolean;
    AllowOnlineCreditCardPayment?: boolean;
    AllowOnlineACHPayment?: boolean;
    domain?: string;
    sparse?: boolean;
    PrivateNote?: string;
    ProjectRef?: QuickbooksRef;
}

export interface QuickbooksInvoiceLine {
    Id?: string;
    LineNum?: number;
    Description?: string;
    Amount: number;
    LinkedTxn?: QuickbooksLinkedTxn[];
    DetailType: 'SalesItemLineDetail' | 'GroupLineDetail' | 'DescriptionOnly' | 'DiscountLineDetail' | 'SubTotalLineDetail';
    SalesItemLineDetail?: {
        ItemRef: QuickbooksRef;
        UnitPrice?: number;
        Qty?: number;
        TaxCodeRef?: QuickbooksRef;
    };
    DiscountLineDetail?: {
        PercentBased?: boolean;
        DiscountPercent?: number;
        DiscountAccountRef?: QuickbooksRef;
    };
    SubTotalLineDetail?: Record<string, never>;
    DescriptionOnly?: Record<string, never>;
}

export interface QuickbooksItem {
    Id: string;
    Name: string;
    Description?: string;
    Active?: boolean;
    FullyQualifiedName?: string;
    Taxable?: boolean;
    UnitPrice?: number;
    Type: 'Inventory' | 'NonInventory' | 'Service' | 'Category' | 'Bundle';
    IncomeAccountRef?: QuickbooksRef;
    PurchaseDesc?: string;
    PurchaseCost?: number;
    ExpenseAccountRef?: QuickbooksRef;
    AssetAccountRef?: QuickbooksRef;
    TrackQtyOnHand?: boolean;
    QtyOnHand?: number;
    InvStartDate?: string;
    SubItem?: boolean;
    ParentRef?: QuickbooksRef;
    Level?: number;
    TaxClassificationRef?: QuickbooksRef;
    domain?: string;
    sparse?: boolean;
    MetaData?: QuickbooksMetaData;
}

export interface QuickbooksAccount {
    Id: string;
    Name: string;
    AccountType: string;
    AccountSubType?: string;
    Classification?: string;
    Active?: boolean;
    CurrencyRef?: QuickbooksCurrencyRef;
    CurrentBalance?: number;
    domain?: string;
    sparse?: boolean;
    MetaData?: QuickbooksMetaData;
}

export interface QuickbooksVendor {
    Id: string;
    SyncToken?: string;
    DisplayName: string;
    CompanyName?: string;
    PrintOnCheckName?: string;
    Active?: boolean;
    PrimaryPhone?: QuickbooksPhoneNumber;
    PrimaryEmailAddr?: QuickbooksEmail;
    WebAddr?: QuickbooksWebsite;
    BillAddr?: QuickbooksAddress;
    Balance?: number;
    CurrencyRef?: QuickbooksCurrencyRef;
    Vendor1099?: boolean;
    TaxIdentifier?: string;
    TermRef?: QuickbooksRef;
    AcctNum?: string;
    domain?: string;
    sparse?: boolean;
    MetaData?: QuickbooksMetaData;
}

export interface QuickbooksPurchase {
    Id?: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    DocNumber?: string;
    TxnDate?: string;
    CurrencyRef?: QuickbooksCurrencyRef;
    PrivateNote?: string;
    Line: QuickbooksPurchaseLine[];
    AccountRef: QuickbooksRef;
    EntityRef?: QuickbooksRef;
    PaymentType: 'Cash' | 'Check' | 'CreditCard';
    TotalAmt: number;
    PrintStatus?: string;
    ExchangeRate?: number;
    GlobalTaxCalculation?: string;
    TransactionLocationType?: string;
    Credit?: boolean;
    domain?: string;
    sparse?: boolean;
}

export interface QuickbooksPurchaseLine {
    Id?: string;
    LineNum?: number;
    Description?: string;
    Amount: number;
    LinkedTxn?: QuickbooksLinkedTxn[];
    DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail';
    AccountBasedExpenseLineDetail?: {
        AccountRef: QuickbooksRef;
        ClassRef?: QuickbooksRef;
        BillableStatus?: string;
        CustomerRef?: QuickbooksRef;
        TaxCodeRef?: QuickbooksRef;
    };
    ItemBasedExpenseLineDetail?: {
        ItemRef: QuickbooksRef;
        Qty?: number;
        UnitPrice?: number;
        ClassRef?: QuickbooksRef;
        BillableStatus?: string;
        CustomerRef?: QuickbooksRef;
        TaxCodeRef?: QuickbooksRef;
    };

}

export interface QuickbooksBill {
    Id?: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    DocNumber?: string;
    TxnDate?: string;
    DueDate?: string;
    CurrencyRef?: QuickbooksCurrencyRef;
    PrivateNote?: string;
    Line: QuickbooksPurchaseLine[];
    VendorRef: QuickbooksRef;
    APAccountRef?: QuickbooksRef;
    SalesTermRef?: QuickbooksRef;
    TotalAmt?: number;
    Balance?: number;
    domain?: string;
    sparse?: boolean;
}

export interface QuickbooksPaymentLine {
    Amount: number;
    LinkedTxn?: { TxnId: string; TxnType: string }[];
}

export interface QuickbooksPayment {
    Id?: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    TxnDate?: string;
    CurrencyRef?: QuickbooksCurrencyRef;
    CustomerRef: QuickbooksRef;
    DepositToAccountRef?: QuickbooksRef;
    PaymentMethodRef?: QuickbooksRef;
    PaymentRefNum?: string;
    TotalAmt: number;
    UnappliedAmt?: number;
    PrivateNote?: string;
    Line?: QuickbooksPaymentLine[];
    domain?: string;
    sparse?: boolean;
}

export interface QuickbooksReport {
    Header?: Record<string, unknown>;
    Columns?: { Column?: QuickbooksReportColumn[] };
    Rows?: { Row?: QuickbooksReportRow[] };
}

export interface QuickbooksEstimate {
    Id: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    CustomField?: QuickbooksCustomField[];
    DocNumber?: string;
    TxnDate?: string;
    CurrencyRef?: QuickbooksCurrencyRef;
    LinkedTxn?: QuickbooksLinkedTxn[];
    Line: QuickbooksInvoiceLine[];
    TxnTaxDetail?: {
        TxnTaxCodeRef?: QuickbooksRef;
        TotalTax?: number;
        TaxLine?: QuickbooksTaxLine[];
    };
    CustomerRef: QuickbooksRef;
    CustomerMemo?: { value: string };
    BillAddr?: QuickbooksAddress;
    ShipAddr?: QuickbooksAddress;
    SalesTermRef?: QuickbooksRef;
    DueDate?: string;
    TotalAmt?: number;
    ApplyTaxAfterDiscount?: boolean;
    PrintStatus?: string;
    EmailStatus?: string;
    BillEmail?: QuickbooksEmail;
    AcceptedBy?: string;
    AcceptedDate?: string;
    ExpirationDate?: string;
    TxnStatus?: string;
    domain?: string;
    sparse?: boolean;
    PrivateNote?: string;
    GlobalTaxCalculation?: string;
    ProjectRef?: QuickbooksRef;
}

export interface QuickbooksBillPaymentLine {
    Amount: number;
    LinkedTxn: { TxnId: string; TxnType: 'Bill' }[];
}

export interface QuickbooksBillPayment {
    Id?: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    DocNumber?: string;
    TxnDate?: string;
    CurrencyRef?: QuickbooksCurrencyRef;
    PrivateNote?: string;
    VendorRef: QuickbooksRef;
    APAccountRef?: QuickbooksRef;
    PayType: 'Check' | 'CreditCard';
    CheckPayment?: { BankAccountRef: QuickbooksRef };
    CreditCardPayment?: { CCAccountRef: QuickbooksRef };
    TotalAmt: number;
    Line: QuickbooksBillPaymentLine[];
    domain?: string;
    sparse?: boolean;
}

export interface QuickbooksTerm {
    Id: string;
    Name: string;
    Active?: boolean;
    Type?: string;
    DueDays?: number;
    domain?: string;
    sparse?: boolean;
}

export interface QuickbooksPreferences {
    Id?: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    AccountingInfoPrefs?: {
        ClassTrackingPerTxnLine?: boolean;
        ClassTrackingPerTxn?: boolean;
        TrackDepartments?: boolean;
    };
    domain?: string;
    sparse?: boolean;
}


export interface QuickbooksFault {
    Error: { Message: string; Detail?: string; code: string }[];
    type: string;
}

export interface QuickbooksEntityResponse<T> {
    QueryResponse?: {
        startPosition?: number;
        maxResults?: number;
        totalCount?: number;
    } & {
        [key: string]: T[] | undefined;
    };
    Fault?: QuickbooksFault;
    time?: string;
}

export type QuickbooksCdcEntityBlock<T> = {
    startPosition?: number;
    maxResults?: number;
} & {
    [entityName: string]: T[] | undefined;
};

export interface QuickbooksCdcResponse<T> {
    CDCResponse?: { QueryResponse: QuickbooksCdcEntityBlock<T>[] }[];
    Fault?: QuickbooksFault;
    time?: string;
}

export interface QuickbooksCompanyInfo {
    CompanyName?: string;
    LegalName?: string;
    Email?: { Address?: string };
}

export interface QuickbooksReportColumn {
    ColTitle?: string;
    ColType?: string;
}

export interface QuickbooksReportColData {
    value?: string;
    id?: string;
}

export interface QuickbooksReportRow {
    ColData?: QuickbooksReportColData[];
    Rows?: { Row?: QuickbooksReportRow[] };
    Summary?: { ColData?: QuickbooksReportColData[] };
}

export type QuickbooksRecord = {
    Id: string;
    SyncToken?: string;
    [field: string]: unknown;
};

export type QuickbooksEntityEnvelope = {
    time?: string;
} & {
    [entityName: string]: QuickbooksRecord | undefined;
};

export type QuickbooksQueryEnvelope = {
    QueryResponse?: {
        startPosition?: number;
        maxResults?: number;
        totalCount?: number;
    } & {
        [entityName: string]: QuickbooksRecord[] | undefined;
    };
    time?: string;
};

export type QuickbooksRecurringEnvelope = {
    RecurringTransaction?: {
        [transactionType: string]: QuickbooksRecord | undefined;
    };
    time?: string;
};
