export const FISERV_API_VERSION = 'v11.0.0';

// Account Types
export enum AccountType {
  CHECKING = 'DDA',           // Demand Deposit Account
  SAVINGS = 'SDA',            // Savings Deposit Account
  CERTIFICATE_DEPOSIT = 'CDA', // Certificate of Deposit
  MONEY_MARKET = 'MMA',       // Money Market Account
  LOAN = 'LOAN',
  CREDIT_LINE = 'CRD',        // Credit Line
}

// Party Types
export enum PartyType {
  PERSON = 'Person',
  ORGANIZATION = 'Org',
}

// Collateral Types
export enum CollateralType {
  REAL_ESTATE = 'RealEstate',
  VEHICLE = 'Vehicle',
  EQUIPMENT = 'Equipment',
  CASH = 'Cash',
  SECURITIES = 'Securities',
  OTHER = 'Other',
}

// API Endpoints
export const ENDPOINTS = {
  // Account endpoints
  ACCOUNTS_ADD: '/accounts',
  ACCOUNTS_GET: '/accounts/secured',
  ACCOUNTS_UPDATE: '/accounts',
  ACCOUNTS_UPDATE_OVERDRAFT: '/accounts/overdraft',
  ACCOUNTS_UPDATE_TERM_DEPOSIT: '/accounts/termDeposit',
  ACCOUNTS_UPDATE_INTEREST: '/accounts/interestDeposit',

  // Party endpoints
  PARTIES_ADD: '/parties',
  PARTIES_GET: '/parties/secured',
  PARTIES_UPDATE: '/parties',
  PARTIES_ADD_ADDRESS: '/parties/address',
  PARTIES_UPDATE_ADDRESS: '/parties/address',
  PARTIES_DELETE_ADDRESS: '/parties/address/secured',
  PARTIES_ADD_PHONE: '/parties/phoneNum',
  PARTIES_DELETE_PHONE: '/parties/phoneNum/secured',
  PARTIES_ADD_EMAIL: '/parties/email',
  PARTIES_DELETE_EMAIL: '/parties/email/secured',

  // Collateral endpoints
  COLLATERAL_ADD: '/collateral',
  COLLATERAL_GET: '/collateral/secured',
  COLLATERAL_UPDATE: '/collateral',
  COLLATERAL_DELETE: '/collateral/secured',

  // Escrow endpoints
  ESCROW_ADD: '/escrow',
  ESCROW_GET: '/escrow/secured',
  ESCROW_UPDATE: '/escrow',
  ESCROW_DELETE: '/escrow/secured',
};
