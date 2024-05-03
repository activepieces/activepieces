export type CustomerResponse = {
	Taxable: boolean;
	BillAddr: PhysicalAddress;
	ShipAddr: PhysicalAddress;
	Job: boolean;
	BillWithParent: boolean;
	Balance: number;
	BalanceWithJobs: number;
	CurrencyRef: CurrencyRef;
	PreferredDeliveryMethod: string;
	IsProject: boolean;
	ClientEntityId: string;
	domain: string;
	sparse: boolean;
	Id: string;
	SyncToken: string;
	MetaData: ModificationMetaData;
	GivenName: string;
	FamilyName: string;
	FullyQualifiedName: string;
	CompanyName: string;
	DisplayName: string;
	PrintOnCheckName: string;
	Active: boolean;
	V4IDPseudonym: string;
	PrimaryPhone: {
		FreeFormNumber: string;
	};
	PrimaryEmailAddr: {
		Address: string;
	};
};
type TelephoneNumber = {
	FreeFormNumber: string;
};

type WebSiteAddress = {
	URI: string;
};
type PhysicalAddress = {
	Line1: string;
	Line2: string;
	Line3: string;
	Line4: string;
	Line5: string;
	City: string;
	PostalCode: string;
	Country: string;
	CountrySubDivisionCode: string;
	Lat: string;
	Long: string;
};
type ReferenceType = {
	value: string;
	name?: string;
};

type CurrencyRef = {
	value: string;
	name?: string;
};
type EmailAddress = {
	Address: string;
};

type ModificationMetaData = {
	CreateTime: string;
	LastUpdatedTime: string;
};

export type CreateCustomerParameters = {
	DisplayName: string;
	Title?: string;
	GivenName?: string;
	MiddleName?: string;
	FamilyName?: string;
	CompanyName?: string;
	PrintOnCheckName?: string;
	PrimaryEmailAddr?: EmailAddress;
	PrimaryPhone?: TelephoneNumber;
	AlternatePhone?: TelephoneNumber;
	Mobile?: TelephoneNumber;
	Fax?: TelephoneNumber;
	WebAddr?: WebSiteAddress;
	BillAddr?: Partial<PhysicalAddress>;
	ShipAddr?: Partial<PhysicalAddress>;
	Notes?: string;
	ParentRef?: ReferenceType;
	Job?: boolean;
	BillWithParent?: boolean;
	PreferredDeliveryMethod?: string;
	PaymentMethodRef?: ReferenceType;
	SalesTermRef?: ReferenceType;
	Balance?: number;
	ResaleNum?: string;
	CurrencyRef?: CurrencyRef;
};
export type UpdateCustomerParameters = {
	Id: string;
	SyncToken: string;
	sparse: boolean;
} & Partial<CreateCustomerParameters>;

type SalesItemLineDetail = {
	ItemRef?: ReferenceType;
	ClassRef?: ReferenceType;
	TaxCodeRef?: ReferenceType;
	ServiceDate?: string;
	Qty?: number;
	UnitPrice?: number;
};
export type SalesItemLine = {
	DetailType: string;
	Amount: number;
	Description?: string;
	SalesItemLineDetail: SalesItemLineDetail;
};
type MemoRef = {
	value: string;
};
export type CreateInvoiceParameters = {
	CustomerRef: ReferenceType;
	BillEmail?: EmailAddress;
	BillEmailCc?: EmailAddress;
	BillEmailBcc?: EmailAddress;
	Line: Array<SalesItemLine>;
	TxnDate?: string;
	DueDate?: string;
	ShipDate?: string;
	TrackingNum?: string;
	CustomerMemo?: MemoRef;
	PrivateNote?: string;
};

export type GetCustomerParameters = {
	customerId: string;
};

export type UpdateCustomerResponse = CreateCustomerResponse;
export type GetCustomerResponse = CreateCustomerResponse;

export type CreateCustomerResponse = {
	Customer: CustomerResponse;
	time: string;
};

export type CompanyCurrencyResponse = {
	SyncToken: string;
	domain: string;
	Code: string;
	Name: string;
	sparse: boolean;
	Active: boolean;
	Id: string;
	MetaData: ModificationMetaData;
};
export type PaymentMethodResponse = {
	Name: string;
	Active: boolean;
	Type: string;
	domain: string;
	sparse: boolean;
	Id: string;
	SyncToken: string;
	MetaData: ModificationMetaData;
};

export type TermResponse = {
	Name: string;
	Active: boolean;
	Type: string;
	DueDays: number;
	DiscountDays: number;
	domain: string;
	sparse: boolean;
	Id: string;
	SyncToken: string;
	MetaData: ModificationMetaData;
};

export type ItemResponse = {
	Name: string;
	Description: string;
	Active: boolean;
	FullyQualifiedName: string;
	Taxable: boolean;
	UnitPrice: number;
	Type: string;
	IncomeAccountRef: {
		value: string;
		name: string;
	};
	PurchaseCost: number;
	TrackQtyOnHand: boolean;
	domain: string;
	sparse: boolean;
	Id: string;
	SyncToken: string;
	MetaData: ModificationMetaData;
};

export type ClassResponse = {
	FullyQualifiedName: string;
	domain: string;
	Name: string;
	SyncToken: string;
	SubClass: boolean;
	sparse: boolean;
	Active: boolean;
	Id: string;
	MetaData: ModificationMetaData;
};

export type TaxCodeResponse = {
	Name: string;
	Description: string;
	Taxable: boolean;
	TaxGroup: boolean;
	Id: string;
	MetaData: ModificationMetaData;
};

export type QueryParameters = {
	query?: string;
};

export type QueryCustomerResponse = {
	QueryResponse: {
		Customer: Array<CustomerResponse>;
		startPosition?: number;
		maxResults?: number;
	};
	time: string;
};

export type QueryCompanyCurrencyResponse = {
	QueryResponse: {
		CompanyCurrency: Array<CompanyCurrencyResponse>;
		startPosition?: number;
		maxResults?: number;
	};
	time: string;
};
export type QueryPaymentMethodResponse = {
	QueryResponse: {
		PaymentMethod: Array<PaymentMethodResponse>;
		startPosition?: number;
		maxResults?: number;
	};
	time: string;
};
export type QueryItemResponse = {
	QueryResponse: {
		Item: Array<ItemResponse>;
		startPosition?: number;
		maxResults?: number;
	};
	time: string;
};

export type QueryTermResponse = {
	QueryResponse: {
		Term: Array<TermResponse>;
		startPosition?: number;
		maxResults?: number;
	};
	time: string;
};

export type QueryClassResponse = {
	QueryResponse: {
		Class: Array<ClassResponse>;
		startPosition?: number;
		maxResults?: number;
	};
	time: string;
};

export type QueryTaxCodeResponse = {
	QueryResponse: {
		TaxCode: Array<TaxCodeResponse>;
		startPosition?: number;
		maxResults?: number;
		totalCount?: number;
	};
	time: string;
};
