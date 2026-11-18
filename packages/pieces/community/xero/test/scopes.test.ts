import { describe, expect, it } from 'vitest';
import { xeroAuth, xeroScopes } from '../src';

const probedScopes = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'accounting.contacts',
  'accounting.invoices',
  'accounting.payments',
  'accounting.banktransactions',
  'accounting.manualjournals',
  'accounting.reports.aged.read',
  'accounting.reports.balancesheet.read',
  'accounting.reports.banksummary.read',
  'accounting.reports.executivesummary.read',
  'accounting.reports.profitandloss.read',
  'accounting.reports.taxreports.read',
  'accounting.reports.trialbalance.read',
  'accounting.budgets.read',
  'accounting.attachments',
  'accounting.settings',
  'projects',
];

const refusedScopes = [
  'accounting.transactions',
  'accounting.reports.read',
  'accounting.journals.read',
  'accounting.classicexpenses',
];

describe('xero oauth scopes', () => {
  it('requests exactly the scopes probed as accepted for a new Xero app', () => {
    expect(xeroAuth.scope).toEqual(probedScopes);
    expect(xeroScopes).toEqual(probedScopes);
  });

  it('requests none of the scopes Xero refuses for new apps', () => {
    for (const scope of refusedScopes) {
      expect(xeroAuth.scope).not.toContain(scope);
    }
  });

  it('has no duplicate scopes', () => {
    expect(new Set(xeroAuth.scope).size).toBe(xeroAuth.scope.length);
  });

  it('keeps the Xero authorize and token urls', () => {
    expect(xeroAuth.authUrl).toBe('https://login.xero.com/identity/connect/authorize');
    expect(xeroAuth.tokenUrl).toBe('https://identity.xero.com/connect/token');
  });
});
