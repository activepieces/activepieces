import { describe, expect, it } from 'vitest';
import { salesforceUtils } from './utils';

const startDate = '2026-10-23T10:00:00.000Z';

describe('salesforceUtils.buildPollingQuery', () => {
  it.each<'CreatedDate' | 'LastModifiedDate'>(['CreatedDate', 'LastModifiedDate'])('keeps every row of an OR condition inside the %s filter', (dateField) => {
    const query = salesforceUtils.buildPollingQuery({ object: 'Account', dateField, startDate, conditions: "Industry = 'Tech' OR Rating = 'Hot'" });

    expect(query).toBe(
      `SELECT FIELDS(ALL) FROM Account WHERE ${dateField} > ${startDate} AND (Industry = 'Tech' OR Rating = 'Hot') ORDER BY ${dateField} ASC LIMIT 200 OFFSET 0`,
    );
  });

  it.each([undefined, ''])('adds no condition clause when the condition is %j', (conditions) => {
    const query = salesforceUtils.buildPollingQuery({ object: 'Lead', dateField: 'CreatedDate', startDate, conditions });

    expect(query).toBe(`SELECT FIELDS(ALL) FROM Lead WHERE CreatedDate > ${startDate} ORDER BY CreatedDate ASC LIMIT 200 OFFSET 0`);
    expect(query).not.toContain('AND');
  });
});

describe('salesforceUtils.getHistoryObjectName', () => {
  it.each([
    ['Opportunity', 'OpportunityFieldHistory'],
    ['Account', 'AccountHistory'],
    ['Case', 'CaseHistory'],
    ['Invoice__c', 'Invoice__History'],
  ])('reads %s field history from %s', (object, historyObject) => {
    expect(salesforceUtils.getHistoryObjectName(object)).toBe(historyObject);
  });
});
