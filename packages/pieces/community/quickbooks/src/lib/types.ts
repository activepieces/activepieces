export interface QuickbooksRef {
    value: string;
    name?: string; // Optional based on context
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
    DateValue?: string; // YYYY-MM-DD
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
    LinkedTxn?: any[]; 
    Line: QuickbooksInvoiceLine[];
    TxnTaxDetail?: { TotalTax?: number; TaxLine?: any[]; };
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
    LinkedTxn?: any[];
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
    AssetAccountRef?: QuickbooksRef; // For Inventory type
    TrackQtyOnHand?: boolean; // For Inventory type
    QtyOnHand?: number; // For Inventory type
    InvStartDate?: string; // For Inventory type
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
    AccountType: string; // e.g., 'Bank', 'Credit Card', 'Accounts Receivable', 'Expense', 'Income'
    AccountSubType?: string;
    Classification?: string; // e.g., 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
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
    AccountRef: QuickbooksRef; // Account money came from (Bank/CC)
    EntityRef?: QuickbooksRef; // Payee (Vendor)
    PaymentType: 'Cash' | 'Check' | 'CreditCard';
    TotalAmt: number;
    PrintStatus?: string;
    ExchangeRate?: number;
    GlobalTaxCalculation?: string;
    TransactionLocationType?: string;
    Credit?: boolean; // Specifies if this is a vendor credit
    domain?: string;
    sparse?: boolean;
}

export interface QuickbooksPurchaseLine {
    Id?: string;
    LineNum?: number;
    Description?: string;
    Amount: number;
    LinkedTxn?: any[];
    DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail'; // Add others if needed
    AccountBasedExpenseLineDetail?: {
        AccountRef: QuickbooksRef; // Expense Account
        BillableStatus?: string;
        CustomerRef?: QuickbooksRef;
        TaxCodeRef?: QuickbooksRef;
    };
    ItemBasedExpenseLineDetail?: {
        ItemRef: QuickbooksRef;
        Qty?: number;
        UnitPrice?: number;
        BillableStatus?: string;
        CustomerRef?: QuickbooksRef;
        TaxCodeRef?: QuickbooksRef;
    };
    // Add other detail types if needed
}

export interface QuickbooksEstimate {
    Id: string;
    SyncToken?: string;
    MetaData?: QuickbooksMetaData;
    CustomField?: QuickbooksCustomField[];
    DocNumber?: string;
    TxnDate?: string;
    CurrencyRef?: QuickbooksCurrencyRef;
    LinkedTxn?: any[];
    Line: QuickbooksInvoiceLine[];
    TxnTaxDetail?: {
        TxnTaxCodeRef?: QuickbooksRef;
        TotalTax?: number;
        TaxLine?: {
            DetailType: 'TaxLineDetail';
            Amount?: number;
            TaxLineDetail?: {
                TaxRateRef?: QuickbooksRef;
                PercentBased?: boolean;
                TaxPercent?: number;
                NetAmountTaxable?: number;
            }
        }[];
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