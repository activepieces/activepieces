"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENDPOINTS = exports.CollateralType = exports.PartyType = exports.AccountType = exports.FISERV_API_VERSION = void 0;
exports.FISERV_API_VERSION = 'v11.0.0';
// Account Types
var AccountType;
(function (AccountType) {
    AccountType["CHECKING"] = "DDA";
    AccountType["SAVINGS"] = "SDA";
    AccountType["CERTIFICATE_DEPOSIT"] = "CDA";
    AccountType["MONEY_MARKET"] = "MMA";
    AccountType["LOAN"] = "LOAN";
    AccountType["CREDIT_LINE"] = "CRD";
})(AccountType || (exports.AccountType = AccountType = {}));
// Party Types
var PartyType;
(function (PartyType) {
    PartyType["PERSON"] = "Person";
    PartyType["ORGANIZATION"] = "Org";
})(PartyType || (exports.PartyType = PartyType = {}));
// Collateral Types
var CollateralType;
(function (CollateralType) {
    CollateralType["REAL_ESTATE"] = "RealEstate";
    CollateralType["VEHICLE"] = "Vehicle";
    CollateralType["EQUIPMENT"] = "Equipment";
    CollateralType["CASH"] = "Cash";
    CollateralType["SECURITIES"] = "Securities";
    CollateralType["OTHER"] = "Other";
})(CollateralType || (exports.CollateralType = CollateralType = {}));
// API Endpoints
exports.ENDPOINTS = {
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
