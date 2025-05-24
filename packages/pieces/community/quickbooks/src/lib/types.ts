// Common types for QuickBooks entities

export interface QuickbooksRef {
  value: string;
  name?: string;
}

export interface QuickbooksMetadata {
  CreateTime: string;
  LastUpdatedTime: string;
}

export interface QuickbooksEmailAddress {
  Address?: string;
}

export interface QuickbooksPhoneNumber {
  FreeFormNumber?: string;
}

export interface QuickbooksAddress {
  Id?: string;
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  Country?: string;
}

export interface QuickbooksCustomer {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  Title?: string;
  GivenName?: string;
  MiddleName?: string;
  FamilyName?: string;
  Suffix?: string;
  DisplayName: string;
  PrimaryPhone?: QuickbooksPhoneNumber;
  PrimaryEmailAddr?: QuickbooksEmailAddress;
  BillAddr?: QuickbooksAddress;
  ShipAddr?: QuickbooksAddress;
  Active?: boolean;
  Balance?: number;
  BalanceWithJobs?: number;
  CurrencyRef?: QuickbooksRef;
  PreferredDeliveryMethod?: string;
}

export interface QuickbooksVendor {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  Title?: string;
  GivenName?: string;
  MiddleName?: string;
  FamilyName?: string;
  Suffix?: string;
  DisplayName: string;
  PrimaryPhone?: QuickbooksPhoneNumber;
  PrimaryEmailAddr?: QuickbooksEmailAddress;
  BillAddr?: QuickbooksAddress;
  Active?: boolean;
  Balance?: number;
  CurrencyRef?: QuickbooksRef;
  VendorType?: string;
}

export interface QuickbooksAccount {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  Name: string;
  AccountType: string;
  AccountSubType?: string;
  Classification?: string;
  Active?: boolean;
  Description?: string;
  CurrencyRef?: QuickbooksRef;
  CurrentBalance?: number;
  CurrentBalanceWithSubAccounts?: number;
}

export interface QuickbooksLineItem {
  Id?: string;
  LineNum?: number;
  Description?: string;
  Amount: number;
  DetailType: string;
  SalesItemLineDetail?: {
    ItemRef?: QuickbooksRef;
    TaxCodeRef?: QuickbooksRef;
    Qty?: number;
    UnitPrice?: number;
  };
  AccountBasedExpenseLineDetail?: {
    AccountRef: QuickbooksRef;
    TaxCodeRef?: QuickbooksRef;
    BillableStatus?: string;
  };
  DiscountLineDetail?: {
    DiscountPercent?: number;
    DiscountAccountRef?: QuickbooksRef;
  };
  LinkedTxn?: {
    TxnId: string;
    TxnType: string;
    TxnLineId?: string;
  }[];
}

export interface QuickbooksInvoice {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  CustomField?: {
    DefinitionId: string;
    Name: string;
    Type: string;
    StringValue?: string;
  }[];
  DocNumber?: string;
  TxnDate: string;
  CurrencyRef?: QuickbooksRef;
  ExchangeRate?: number;
  PrivateNote?: string;
  LinkedTxn?: {
    TxnId: string;
    TxnType: string;
    TxnLineId?: string;
  }[];
  Line: QuickbooksLineItem[];
  CustomerRef: QuickbooksRef;
  CustomerMemo?: {
    value: string;
  };
  BillAddr?: QuickbooksAddress;
  ShipAddr?: QuickbooksAddress;
  SalesTermRef?: QuickbooksRef;
  DueDate?: string;
  TotalAmt: number;
  HomeTotalAmt?: number;
  Balance?: number;
  HomeBalance?: number;
  BillEmail?: QuickbooksEmailAddress;
  ShipMethodRef?: QuickbooksRef;
  ShipDate?: string;
  TrackingNum?: string;
  AllowIPNPayment?: boolean;
  AllowOnlinePayment?: boolean;
  AllowOnlineCreditCardPayment?: boolean;
  AllowOnlineACHPayment?: boolean;
  EmailStatus?: string;
  DeliveryInfo?: {
    DeliveryType: string;
    DeliveryTime: string;
  };
}

export interface QuickbooksEstimate {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  CustomField?: {
    DefinitionId: string;
    Name: string;
    Type: string;
    StringValue?: string;
  }[];
  DocNumber?: string;
  TxnDate: string;
  CurrencyRef?: QuickbooksRef;
  ExchangeRate?: number;
  PrivateNote?: string;
  Line: QuickbooksLineItem[];
  CustomerRef: QuickbooksRef;
  CustomerMemo?: {
    value: string;
  };
  BillAddr?: QuickbooksAddress;
  ShipAddr?: QuickbooksAddress;
  SalesTermRef?: QuickbooksRef;
  DueDate?: string;
  TotalAmt: number;
  HomeTotalAmt?: number;
  ExpirationDate?: string;
  AcceptedBy?: string;
  AcceptedDate?: string;
  BillEmail?: QuickbooksEmailAddress;
  ShipMethodRef?: QuickbooksRef;
  ShipDate?: string;
  TrackingNum?: string;
  EmailStatus?: string;
}

export interface QuickbooksPayment {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  TxnDate: string;
  CurrencyRef?: QuickbooksRef;
  ExchangeRate?: number;
  PrivateNote?: string;
  Line: QuickbooksLineItem[];
  CustomerRef: QuickbooksRef;
  PaymentMethodRef?: QuickbooksRef;
  DepositToAccountRef?: QuickbooksRef;
  TotalAmt: number;
  UnappliedAmt?: number;
  ProcessPayment?: boolean;
}

export interface QuickbooksPurchase {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  DocNumber?: string;
  TxnDate: string;
  CurrencyRef?: QuickbooksRef;
  ExchangeRate?: number;
  PrivateNote?: string;
  PaymentType: string;
  AccountRef: QuickbooksRef;
  EntityRef?: QuickbooksRef;
  Line: QuickbooksLineItem[];
  TotalAmt: number;
  HomeTotalAmt?: number;
  Credit?: boolean;
}

export interface QuickbooksDeposit {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  TxnDate: string;
  CurrencyRef?: QuickbooksRef;
  ExchangeRate?: number;
  PrivateNote?: string;
  Line: QuickbooksLineItem[];
  DepositToAccountRef: QuickbooksRef;
  TotalAmt: number;
  HomeTotalAmt?: number;
}

export interface QuickbooksTransfer {
  Id: string;
  SyncToken: string;
  MetaData?: QuickbooksMetadata;
  TxnDate: string;
  CurrencyRef?: QuickbooksRef;
  PrivateNote?: string;
  FromAccountRef: QuickbooksRef;
  ToAccountRef: QuickbooksRef;
  Amount: number;
}
