export declare const FISERV_API_VERSION = "v11.0.0";
export declare enum AccountType {
    CHECKING = "DDA",// Demand Deposit Account
    SAVINGS = "SDA",// Savings Deposit Account
    CERTIFICATE_DEPOSIT = "CDA",// Certificate of Deposit
    MONEY_MARKET = "MMA",// Money Market Account
    LOAN = "LOAN",
    CREDIT_LINE = "CRD"
}
export declare enum PartyType {
    PERSON = "Person",
    ORGANIZATION = "Org"
}
export declare enum CollateralType {
    REAL_ESTATE = "RealEstate",
    VEHICLE = "Vehicle",
    EQUIPMENT = "Equipment",
    CASH = "Cash",
    SECURITIES = "Securities",
    OTHER = "Other"
}
export declare const ENDPOINTS: {
    ACCOUNTS_ADD: string;
    ACCOUNTS_GET: string;
    ACCOUNTS_UPDATE: string;
    ACCOUNTS_UPDATE_OVERDRAFT: string;
    ACCOUNTS_UPDATE_TERM_DEPOSIT: string;
    ACCOUNTS_UPDATE_INTEREST: string;
    PARTIES_ADD: string;
    PARTIES_GET: string;
    PARTIES_UPDATE: string;
    PARTIES_ADD_ADDRESS: string;
    PARTIES_UPDATE_ADDRESS: string;
    PARTIES_DELETE_ADDRESS: string;
    PARTIES_ADD_PHONE: string;
    PARTIES_DELETE_PHONE: string;
    PARTIES_ADD_EMAIL: string;
    PARTIES_DELETE_EMAIL: string;
    COLLATERAL_ADD: string;
    COLLATERAL_GET: string;
    COLLATERAL_UPDATE: string;
    COLLATERAL_DELETE: string;
    ESCROW_ADD: string;
    ESCROW_GET: string;
    ESCROW_UPDATE: string;
    ESCROW_DELETE: string;
};
