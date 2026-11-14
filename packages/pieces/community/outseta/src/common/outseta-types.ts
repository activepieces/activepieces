export type OutsetaCollection<T> =
  | T[]
  | { items?: T[]; Items?: T[] }
  | null
  | undefined;

export type OutsetaPage<T> = {
  metadata?: { limit?: number; offset?: number; total?: number };
  items?: T[];
  Items?: T[];
};

export type OutsetaAddress = {
  AddressLine1?: string | null;
  AddressLine2?: string | null;
  AddressLine3?: string | null;
  City?: string | null;
  State?: string | null;
  PostalCode?: string | null;
  Country?: string | null;
};

export type OutsetaPlanFamily = {
  Uid?: string | null;
  Name?: string | null;
};

export type OutsetaPlan = {
  Uid?: string | null;
  Name?: string | null;
  Description?: string | null;
  PlanFamily?: OutsetaPlanFamily | null;
  MonthlyRate?: number | null;
  AnnualRate?: number | null;
  QuarterlyRate?: number | null;
  OneTimeRate?: number | null;
  SetupFee?: number | null;
  IsActive?: boolean | null;
  IsTaxable?: boolean | null;
  IsPerUser?: boolean | null;
  IsQuantityEditable?: boolean | null;
  MinimumQuantity?: number | null;
  MaximumPeople?: number | null;
  TrialPeriodDays?: number | null;
  UnitOfMeasure?: string | null;
  ExpiresAfterMonths?: number | null;
  ExpirationDate?: string | null;
  Created?: string | null;
  Updated?: string | null;
};

export type OutsetaAddOn = {
  Uid?: string | null;
  Name?: string | null;
  BillingAddOnType?: number | null;
  IsQuantityEditable?: boolean | null;
  MinimumQuantity?: number | null;
  MonthlyRate?: number | null;
  AnnualRate?: number | null;
  QuarterlyRate?: number | null;
  OneTimeRate?: number | null;
  SetupFee?: number | null;
  UnitOfMeasure?: string | null;
  IsTaxable?: boolean | null;
  IsBilledDuringTrial?: boolean | null;
  ExpiresAfterMonths?: number | null;
  ExpirationDate?: string | null;
  Created?: string | null;
  Updated?: string | null;
};

export type OutsetaSubscriptionAddOn = {
  Uid?: string | null;
  AddOn?: OutsetaAddOn | null;
  Quantity?: number | null;
  Rate?: number | null;
  StartDate?: string | null;
  EndDate?: string | null;
  ExpirationDate?: string | null;
  RenewalDate?: string | null;
};

export type OutsetaInvoice = {
  Uid?: string | null;
  Number?: number | null;
  InvoiceDate?: string | null;
  BillingInvoiceStatus?: number | null;
  Amount?: number | null;
  AmountOutstanding?: number | null;
  AmountPaid?: number | null;
};

export type OutsetaSubscription = {
  Uid?: string | null;
  Account?: OutsetaAccount | null;
  Plan?: OutsetaPlan | null;
  BillingRenewalTerm?: number | null;
  Quantity?: number | null;
  Rate?: number | null;
  DiscountCode?: string | null;
  DiscountCouponExpirationDate?: string | null;
  StartDate?: string | null;
  EndDate?: string | null;
  ExpirationDate?: string | null;
  RenewalDate?: string | null;
  NewRequiredQuantity?: number | null;
  IsPlanUpgradeRequired?: boolean | null;
  PlanUpgradeRequiredMessage?: string | null;
  LatestInvoice?: OutsetaInvoice | null;
  SubscriptionAddOns?: OutsetaCollection<OutsetaSubscriptionAddOn>;
  Created?: string | null;
  Updated?: string | null;
};

export type OutsetaPersonAccount = {
  Uid?: string | null;
  Account?: OutsetaAccount | null;
  Person?: OutsetaPerson | null;
  IsPrimary?: boolean | null;
  ReceiveInvoices?: boolean | null;
  Role?: number | null;
};

export type OutsetaPerson = {
  Uid?: string | null;
  Email?: string | null;
  FirstName?: string | null;
  LastName?: string | null;
  FullName?: string | null;
  PhoneMobile?: string | null;
  PhoneWork?: string | null;
  Title?: string | null;
  Timezone?: string | null;
  Language?: string | null;
  HasLoggedIn?: boolean | null;
  HasUnsubscribed?: boolean | null;
  LastLoginDateTime?: string | null;
  MailingAddress?: OutsetaAddress | null;
  PersonAccount?: OutsetaCollection<OutsetaPersonAccount>;
  Account?: OutsetaAccount | null;
  Created?: string | null;
  Updated?: string | null;
  [key: string]: unknown;
};

export type OutsetaAccount = {
  Uid?: string | null;
  Name?: string | null;
  AccountStage?: number | null;
  AccountStageLabel?: string | null;
  ClientIdentifier?: string | null;
  Currency?: string | null;
  InvoiceNotes?: string | null;
  IsDemo?: boolean | null;
  HasLoggedIn?: boolean | null;
  LifetimeRevenue?: number | null;
  DomainName?: string | null;
  LastLoginDateTime?: string | null;
  BillingAddress?: OutsetaAddress | null;
  MailingAddress?: OutsetaAddress | null;
  PrimaryContact?: OutsetaPerson | null;
  CurrentSubscription?: OutsetaSubscription | null;
  Created?: string | null;
  Updated?: string | null;
  [key: string]: unknown;
};

export type OutsetaDealPipeline = {
  Uid?: string | null;
  Name?: string | null;
};

export type OutsetaDealPipelineStage = {
  Uid?: string | null;
  Name?: string | null;
  DealPipeline?: OutsetaDealPipeline | null;
};

export type OutsetaDealPerson = {
  Uid?: string | null;
  Person?: OutsetaPerson | null;
};

export type OutsetaDeal = {
  Uid?: string | null;
  Name?: string | null;
  Amount?: number | null;
  DueDate?: string | null;
  AssignedToPersonClientIdentifier?: string | null;
  DealPipelineStage?: OutsetaDealPipelineStage | null;
  DealPeople?: OutsetaCollection<OutsetaDealPerson>;
  Account?: OutsetaAccount | null;
  Created?: string | null;
  Updated?: string | null;
  [key: string]: unknown;
};

export type OutsetaDiscountCoupon = {
  Uid?: string | null;
  Name?: string | null;
  UniqueIdentifier?: string | null;
  IsActive?: boolean | null;
  AmountOff?: number | null;
  PercentOff?: number | null;
  RedeemBy?: string | null;
  Duration?: number | null;
  DurationInMonths?: number | null;
  TimesRedeemed?: number | null;
  MaxRedemptions?: number | null;
  ApplyToAddOns?: boolean | null;
  Created?: string | null;
  Updated?: string | null;
};

export type OutsetaCase = {
  Uid?: string | null;
  Subject?: string | null;
  Body?: string | null;
  Status?: number | null;
  Source?: number | null;
  SubmittedDateTime?: string | null;
  LastActivity?: string | null;
  AssignedToPersonClientIdentifier?: string | null;
  FromPerson?: OutsetaPerson | null;
  Created?: string | null;
  Updated?: string | null;
};

export type OutsetaTransaction = {
  Uid?: string | null;
  TransactionDate?: string | null;
  BillingTransactionType?: number | null;
  Amount?: number | null;
  IsCaptured?: boolean | null;
  IsElectronicTransaction?: boolean | null;
  Account?: OutsetaAccount | null;
  Invoice?: OutsetaInvoice | null;
  Created?: string | null;
  Updated?: string | null;
};
