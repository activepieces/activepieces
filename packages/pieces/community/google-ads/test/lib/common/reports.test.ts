import { describe, expect, it } from 'vitest';

import { DEFAULT_METRICS, buildReportQuery, flattenRow } from '../../../src/lib/common/reports';

describe('buildReportQuery()', () => {
  it('should default to entity fields, the default metrics and the last 30 days', () => {
    expect(buildReportQuery({ resource: 'campaign' })).toBe(
      `SELECT campaign.id, campaign.name, campaign.status, ${DEFAULT_METRICS.join(', ')} FROM campaign WHERE segments.date DURING LAST_30_DAYS`
    );
  });

  it('should honour custom fields, metrics, date segment, filter, order and limit', () => {
    expect(
      buildReportQuery({
        resource: 'ad_group',
        fields: ['ad_group.id', ' ad_group.name '],
        metrics: ['metrics.clicks', 'metrics.clicks'],
        segmentByDate: true,
        dateRange: 'LAST_7_DAYS',
        where: "campaign.status = 'ENABLED'",
        orderBy: 'metrics.clicks DESC',
        limit: 50.7,
      })
    ).toBe(
      "SELECT ad_group.id, ad_group.name, segments.date, metrics.clicks FROM ad_group WHERE segments.date DURING LAST_7_DAYS AND campaign.status = 'ENABLED' ORDER BY metrics.clicks DESC LIMIT 50"
    );
  });

  it('should build a BETWEEN clause for custom ranges and require both dates', () => {
    expect(buildReportQuery({ resource: 'customer', dateRange: 'CUSTOM', startDate: '2026-09-01', endDate: '2026-09-15' })).toContain(
      "WHERE segments.date BETWEEN '2026-09-01' AND '2026-09-15'"
    );
    expect(() => buildReportQuery({ resource: 'customer', dateRange: 'CUSTOM', startDate: '2026-09-01' })).toThrow('YYYY-MM-DD');
    expect(() => buildReportQuery({ resource: 'customer', dateRange: 'CUSTOM', startDate: '01/09/2026', endDate: '2026-09-15' })).toThrow(
      'YYYY-MM-DD'
    );
  });

  it('should drop the date filter for all time', () => {
    expect(buildReportQuery({ resource: 'keyword_view', dateRange: 'ALL_TIME' })).not.toContain('WHERE');
  });

  it('should reject unknown resources and date ranges', () => {
    expect(() => buildReportQuery({ resource: 'banner' as never })).toThrow('Unknown report resource');
    expect(() => buildReportQuery({ resource: 'campaign', dateRange: 'LAST_YEAR' as never })).toThrow('Unknown date range');
  });
});

describe('flattenRow()', () => {
  it('should turn nested REST rows into dotted GAQL-style keys, keeping arrays as values', () => {
    expect(
      flattenRow({
        campaign: { id: '1', name: 'A' },
        metrics: { clicks: '5', costMicros: '1000' },
        segments: { date: '2026-09-01' },
        adGroupAd: { ad: { finalUrls: ['https://a', 'https://b'] } },
      })
    ).toEqual({
      'campaign.id': '1',
      'campaign.name': 'A',
      'metrics.clicks': '5',
      'metrics.cost_micros': '1000',
      'segments.date': '2026-09-01',
      'ad_group_ad.ad.final_urls': ['https://a', 'https://b'],
    });
  });
});
