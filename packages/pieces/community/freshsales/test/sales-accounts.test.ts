import { describe, expect, it } from 'vitest';
import { freshsalesRecords } from '../src/lib/common/records';

describe('freshsales contact sales accounts merge', () => {
  it('reads account ids from the contact when Freshsales nests them', () => {
    const body = {
      contact: {
        id: 1,
        sales_accounts: [
          { id: 101, is_primary: true },
          { id: 102, is_primary: false },
        ],
      },
    };

    expect(freshsalesRecords.readSalesAccountIds(body)).toEqual([101, 102]);
  });

  it('reads account ids from the top-level side-loaded list', () => {
    const body = { contact: { id: 1 }, sales_accounts: [{ id: '201' }, { id: 202 }, { id: 202 }] };

    expect(freshsalesRecords.readSalesAccountIds(body)).toEqual([201, 202]);
  });

  it('returns no ids when the contact has no accounts', () => {
    expect(freshsalesRecords.readSalesAccountIds({ contact: { id: 1 } })).toEqual([]);
  });

  it('keeps existing accounts as secondary and makes the chosen one primary', () => {
    expect(freshsalesRecords.mergeSalesAccounts({ existingIds: [101, 102], primaryId: 300 })).toEqual([
      { id: 300, is_primary: true },
      { id: 101, is_primary: false },
      { id: 102, is_primary: false },
    ]);
  });

  it('promotes an already linked account without duplicating it', () => {
    expect(freshsalesRecords.mergeSalesAccounts({ existingIds: [101, 102], primaryId: 102 })).toEqual([
      { id: 102, is_primary: true },
      { id: 101, is_primary: false },
    ]);
  });
});
