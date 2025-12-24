import { Property } from '@activepieces/pieces-framework';
import { AccountType, PartyType, CollateralType } from './constants';

// Shared property builders for reuse across actions

export const accountIdProp = Property.ShortText({
  displayName: 'Account ID',
  description: 'The unique identifier for the account',
  required: true,
});

export const accountTypeProp = Property.StaticDropdown({
  displayName: 'Account Type',
  description: 'Type of account to create',
  required: true,
  options: {
    options: [
      { label: 'Checking (DDA)', value: AccountType.CHECKING },
      { label: 'Savings (SDA)', value: AccountType.SAVINGS },
      { label: 'Certificate of Deposit (CDA)', value: AccountType.CERTIFICATE_DEPOSIT },
      { label: 'Money Market (MMA)', value: AccountType.MONEY_MARKET },
      { label: 'Loan', value: AccountType.LOAN },
      { label: 'Credit Line', value: AccountType.CREDIT_LINE },
    ],
  },
});

export const partyIdProp = Property.ShortText({
  displayName: 'Party ID',
  description: 'The unique identifier for the party/customer',
  required: true,
});

export const partyTypeProp = Property.StaticDropdown({
  displayName: 'Party Type',
  description: 'Type of party (customer)',
  required: true,
  options: {
    options: [
      { label: 'Person (Individual)', value: PartyType.PERSON },
      { label: 'Organization (Business)', value: PartyType.ORGANIZATION },
    ],
  },
});

export const collateralIdProp = Property.ShortText({
  displayName: 'Collateral ID',
  description: 'The unique identifier for the collateral',
  required: true,
});

export const collateralTypeProp = Property.StaticDropdown({
  displayName: 'Collateral Type',
  description: 'Type of collateral',
  required: true,
  options: {
    options: [
      { label: 'Real Estate', value: CollateralType.REAL_ESTATE },
      { label: 'Vehicle', value: CollateralType.VEHICLE },
      { label: 'Cash', value: CollateralType.CASH },
      { label: 'Securities', value: CollateralType.SECURITIES },
      { label: 'Other', value: CollateralType.OTHER },
    ],
  },
});

export const escrowIdProp = Property.ShortText({
  displayName: 'Escrow ID',
  description: 'The unique identifier for the escrow account',
  required: true,
});
