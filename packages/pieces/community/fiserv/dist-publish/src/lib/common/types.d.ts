export interface EFXHeader {
    OrgId: string;
    TrnId: string;
}
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
}
export interface LoanAccountInfo {
    LoanType?: string;
    LoanAmt?: number;
    IntRate?: number;
}
export interface PartyRequest {
    PartyType: string;
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
}
export interface OrgPartyInfo {
    OrgName?: string;
    TaxIdent?: string;
    EstablishedDt?: string;
}
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
export interface CollateralRequest {
    CollateralType?: string;
    CollateralValue?: number;
    Description?: string;
}
export interface EscrowRequest {
    EscrowType?: string;
    EscrowAmt?: number;
}
export interface FiservResponse<T> {
    Status?: {
        StatusCode?: string;
        StatusDesc?: string;
    };
    Rec?: T;
}
