import { describe, expect, it } from 'vitest';

import {
  RESOURCES,
  RESOURCE_TYPES,
  buildOperation,
  idFromResourceName,
  newestRecordsQuery,
  recordByResourceNameQuery,
  recordsByResourceNamesQuery,
  readField,
  resourceDefinition,
  resourceNameFor,
  updateMaskFor,
} from '../../../src/lib/common/resources';

describe('resourceDefinition()', () => {
  it('should know the five record types', () => {
    expect(RESOURCE_TYPES).toEqual(['campaign', 'ad_group', 'ad_group_ad', 'ad_group_criterion', 'user_list']);
    expect(resourceDefinition('campaign').operationKey).toBe('campaignOperation');
  });

  it('should reject unknown types with the list of valid ones', () => {
    expect(() => resourceDefinition('banner')).toThrow('Unknown resource type "banner"');
  });
});

describe('resourceNameFor()', () => {
  it('should build simple resource names from numeric ids', () => {
    expect(resourceNameFor({ def: RESOURCES.campaign, customerId: '1234567890', identifier: '42' })).toBe('customers/1234567890/campaigns/42');
    expect(resourceNameFor({ def: RESOURCES.user_list, customerId: '1234567890', identifier: ' 7 ' })).toBe('customers/1234567890/userLists/7');
  });

  it('should require composite ids for ads and keywords', () => {
    expect(resourceNameFor({ def: RESOURCES.ad_group_ad, customerId: '1234567890', identifier: '11~22' })).toBe('customers/1234567890/adGroupAds/11~22');
    expect(() => resourceNameFor({ def: RESOURCES.ad_group_criterion, customerId: '1234567890', identifier: '22' })).toThrow('<adGroupId>~<criterionId>');
  });

  it('should pass full resource names through when they match the type', () => {
    expect(resourceNameFor({ def: RESOURCES.ad_group, customerId: '1234567890', identifier: 'customers/1234567890/adGroups/5' })).toBe(
      'customers/1234567890/adGroups/5'
    );
    expect(() => resourceNameFor({ def: RESOURCES.ad_group, customerId: '1234567890', identifier: 'customers/1234567890/campaigns/5' })).toThrow(
      'not a ad group resource name'
    );
  });

  it('should reject malformed full resource names before sending anything', () => {
    for (const identifier of [
      'customers/1234567890/campaigns/5/extra',
      'customers/abc/campaigns/5',
      'customers/1234567890/campaigns/abc',
      'customers/1234567890/campaigns/',
      'customers/1234567890/xcampaigns/5',
      'customers/1234567890/campaigns/5~6',
    ]) {
      expect(() => resourceNameFor({ def: RESOURCES.campaign, customerId: '1234567890', identifier })).toThrow('is not a campaign resource name');
    }
    expect(() => resourceNameFor({ def: RESOURCES.ad_group_criterion, customerId: '1234567890', identifier: 'customers/1234567890/adGroupCriteria/22' })).toThrow(
      'customers/<customerId>/adGroupCriteria/<adGroupId>~<criterionId>'
    );
    expect(resourceNameFor({ def: RESOURCES.ad_group_criterion, customerId: '1234567890', identifier: ' customers/1234567890/adGroupCriteria/11~22 ' })).toBe(
      'customers/1234567890/adGroupCriteria/11~22'
    );
  });

  it('should reject a full resource name of another customer', () => {
    expect(() => resourceNameFor({ def: RESOURCES.campaign, customerId: '1234567890', identifier: 'customers/1111111111/campaigns/5' })).toThrow(
      'Campaign customers/1111111111/campaigns/5 belongs to customer 1111111111, but the selected customer is 1234567890.'
    );
  });

  it('should reject non-numeric simple ids', () => {
    expect(() => resourceNameFor({ def: RESOURCES.campaign, customerId: '1234567890', identifier: 'abc' })).toThrow('must be numeric');
  });
});

describe('idFromResourceName()', () => {
  it('should return the last segment or null', () => {
    expect(idFromResourceName('customers/1/adGroupAds/2~3')).toBe('2~3');
    expect(idFromResourceName(undefined)).toBeNull();
    expect(idFromResourceName('')).toBeNull();
  });
});

describe('updateMaskFor()', () => {
  it('should list every leaf path and skip resourceName', () => {
    expect(
      updateMaskFor({
        resourceName: 'customers/1/adGroups/2',
        name: 'x',
        cpcBidMicros: '100',
        targetingSetting: { targetRestrictions: [{ targetingDimension: 'AUDIENCE' }] },
        keyword: { text: 'a', matchType: 'EXACT' },
        emptyMessage: {},
      })
    ).toBe('name,cpcBidMicros,targetingSetting.targetRestrictions,keyword.text,keyword.matchType,emptyMessage');
  });

  it('should refuse an empty update', () => {
    expect(() => updateMaskFor({ resourceName: 'customers/1/campaigns/2' })).toThrow('Nothing to update');
  });
});

describe('readField()', () => {
  it('should walk a GAQL path over a camelCase REST row', () => {
    const row = { adGroupAd: { ad: { id: '99' }, status: 'ENABLED' }, adGroupCriterion: { criterionId: '7' } };
    expect(readField({ row, gaqlPath: 'ad_group_ad.ad.id' })).toBe('99');
    expect(readField({ row, gaqlPath: 'ad_group_criterion.criterion_id' })).toBe('7');
    expect(readField({ row, gaqlPath: 'campaign.id' })).toBeUndefined();
  });
});

describe('buildOperation()', () => {
  it('should wrap the operation in the per-type envelope', () => {
    expect(buildOperation({ def: RESOURCES.ad_group_criterion, operation: { remove: 'customers/1/adGroupCriteria/2~3' } })).toEqual({
      adGroupCriterionOperation: { remove: 'customers/1/adGroupCriteria/2~3' },
    });
  });
});

describe('newestRecordsQuery()', () => {
  it('should select the default fields newest first with the type filter', () => {
    expect(newestRecordsQuery({ def: RESOURCES.ad_group_criterion, limit: 5 })).toBe(
      "SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.ad_group, ad_group_criterion.resource_name FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED' ORDER BY ad_group_criterion.criterion_id DESC LIMIT 5"
    );
    expect(newestRecordsQuery({ def: RESOURCES.campaign })).toMatch(/^SELECT campaign\.id, .* FROM campaign WHERE campaign\.status != 'REMOVED' ORDER BY campaign\.id DESC LIMIT 100$/);
    expect(newestRecordsQuery({ def: RESOURCES.user_list })).toMatch(/^SELECT user_list\.id, .* FROM user_list ORDER BY user_list\.id DESC LIMIT 100$/);
  });

  it('should fetch criteria by resource names with their type, removed ones and other types included so they can be told apart from unreadable ones, and reject anything else', () => {
    expect(recordsByResourceNamesQuery({ def: RESOURCES.ad_group_criterion, resourceNames: ['customers/1/adGroupCriteria/2~3', 'customers/1/adGroupCriteria/4~3'] })).toBe(
      `SELECT ${RESOURCES.ad_group_criterion.fields.join(', ')}, ad_group_criterion.type FROM ad_group_criterion WHERE ad_group_criterion.resource_name IN ('customers/1/adGroupCriteria/2~3', 'customers/1/adGroupCriteria/4~3')`
    );
    expect(recordsByResourceNamesQuery({ def: RESOURCES.ad_group_ad, resourceNames: ['customers/1/adGroupAds/2~3'] })).toBe(
      `SELECT ${RESOURCES.ad_group_ad.fields.join(', ')} FROM ad_group_ad WHERE ad_group_ad.resource_name IN ('customers/1/adGroupAds/2~3')`
    );
    expect(() => recordsByResourceNamesQuery({ def: RESOURCES.ad_group_ad, resourceNames: ["customers/1/adGroupAds/2~3' OR '1"] })).toThrow('is not a ad resource name');
  });

  it('should fetch one record by resource name', () => {
    expect(recordByResourceNameQuery({ def: RESOURCES.user_list, resourceName: 'customers/1/userLists/2' })).toBe(
      `SELECT ${RESOURCES.user_list.fields.join(', ')} FROM user_list WHERE user_list.resource_name = 'customers/1/userLists/2' LIMIT 1`
    );
  });
});
