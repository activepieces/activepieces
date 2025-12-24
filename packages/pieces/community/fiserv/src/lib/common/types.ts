// EFX Header (required on all API calls)
export interface EFXHeader {
  OrgId: string;
  TrnId: string;
  // Add other required fields from swagger as needed
}

// Account related types
export interface AccountRequest {
  AcctType: string;
  AcctPref?: {
    Language?: string;
  };
  DepositAcctInfo?: DepositAccountInfo;
  LoanAcctInfo?: LoanAccountInfo;
}

export interface DepositAccountInfo {
  AcctDtlStatus?: string;
  AcctStmtData?: any;
  // Add fields from swagger AcctAddRqType schema
}

export interface LoanAccountInfo {
  LoanType?: string;
  LoanAmt?: number;
  IntRate?: number;
  // Add fields from swagger AcctAddRqType schema
}

// Party related types
export interface PartyRequest {
  PartyType: string; // 'Person' or 'Org'
  PersonPartyInfo?: PersonPartyInfo;
  OrgPartyInfo?: OrgPartyInfo;
}

export interface PersonPartyInfo {
  PersonName?: {
    FirstName?: string;
    MiddleName?: string;
    LastName?: string;
  };
  TaxIdent?: string;
  BirthDt?: string;
  // Add fields from swagger PartyAddRqType schema
}

export interface OrgPartyInfo {
  OrgName?: string;
  TaxIdent?: string;
  EstablishedDt?: string;
  // Add fields from swagger PartyAddRqType schema
}

// Address types
export interface AddressRequest {
  PartyKeys?: {
    PartyId?: string;
  };
  AddrInfo?: {
    Addr1?: string;
    Addr2?: string;
    City?: string;
    StateProv?: string;
    PostalCode?: string;
    Country?: string;
  };
}

// Collateral types
export interface CollateralRequest {
  CollateralType?: string;
  CollateralValue?: number;
  Description?: string;
  // Add fields from swagger CollateralAddRqType schema
}

// Escrow types
export interface EscrowRequest {
  EscrowType?: string;
  EscrowAmt?: number;
  // Add fields from swagger EscrowAddRqType schema
}

// Generic response wrapper
export interface FiservResponse<T> {
  Status?: {
    StatusCode?: string;
    StatusDesc?: string;
  };
  Rec?: T;
}
