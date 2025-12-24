"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escrowIdProp = exports.collateralTypeProp = exports.collateralIdProp = exports.partyTypeProp = exports.partyIdProp = exports.accountTypeProp = exports.accountIdProp = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
var constants_1 = require("./constants");
// Shared property builders for reuse across actions
exports.accountIdProp = pieces_framework_1.Property.ShortText({
    displayName: 'Account ID',
    description: 'The unique identifier for the account',
    required: true,
});
exports.accountTypeProp = pieces_framework_1.Property.StaticDropdown({
    displayName: 'Account Type',
    description: 'Type of account to create',
    required: true,
    options: {
        options: [
            { label: 'Checking (DDA)', value: constants_1.AccountType.CHECKING },
            { label: 'Savings (SDA)', value: constants_1.AccountType.SAVINGS },
            { label: 'Certificate of Deposit (CDA)', value: constants_1.AccountType.CERTIFICATE_DEPOSIT },
            { label: 'Money Market (MMA)', value: constants_1.AccountType.MONEY_MARKET },
            { label: 'Loan', value: constants_1.AccountType.LOAN },
            { label: 'Credit Line', value: constants_1.AccountType.CREDIT_LINE },
        ],
    },
});
exports.partyIdProp = pieces_framework_1.Property.ShortText({
    displayName: 'Party ID',
    description: 'The unique identifier for the party/customer',
    required: true,
});
exports.partyTypeProp = pieces_framework_1.Property.StaticDropdown({
    displayName: 'Party Type',
    description: 'Type of party (customer)',
    required: true,
    options: {
        options: [
            { label: 'Person (Individual)', value: constants_1.PartyType.PERSON },
            { label: 'Organization (Business)', value: constants_1.PartyType.ORGANIZATION },
        ],
    },
});
exports.collateralIdProp = pieces_framework_1.Property.ShortText({
    displayName: 'Collateral ID',
    description: 'The unique identifier for the collateral',
    required: true,
});
exports.collateralTypeProp = pieces_framework_1.Property.StaticDropdown({
    displayName: 'Collateral Type',
    description: 'Type of collateral',
    required: true,
    options: {
        options: [
            { label: 'Real Estate', value: constants_1.CollateralType.REAL_ESTATE },
            { label: 'Vehicle', value: constants_1.CollateralType.VEHICLE },
            { label: 'Cash', value: constants_1.CollateralType.CASH },
            { label: 'Securities', value: constants_1.CollateralType.SECURITIES },
            { label: 'Other', value: constants_1.CollateralType.OTHER },
        ],
    },
});
exports.escrowIdProp = pieces_framework_1.Property.ShortText({
    displayName: 'Escrow ID',
    description: 'The unique identifier for the escrow account',
    required: true,
});
