import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    buildMonitoringWebhookBody,
    buildNaceSubscriptionBody,
    extractSubscriptionId,
    parseOrgnrs,
    stringList,
} from '../src/lib/common/parse';

const fixture = (name: string): unknown =>
    JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf-8'));

describe('parseOrgnrs', () => {
    it('splits array entries on commas, whitespace and semicolons', () => {
        expect(parseOrgnrs(['923609016, 914778271', ' 999999999 ;888888888'])).toEqual([
            '923609016',
            '914778271',
            '999999999',
            '888888888',
        ]);
    });

    it('accepts a plain string and drops empty entries', () => {
        expect(parseOrgnrs('923609016,\n914778271,,')).toEqual(['923609016', '914778271']);
        expect(parseOrgnrs(undefined)).toEqual([]);
    });
});

describe('stringList', () => {
    it('trims and drops empties; non-arrays become []', () => {
        expect(stringList([' 03 ', '', '11'])).toEqual(['03', '11']);
        expect(stringList('03')).toEqual([]);
    });
});

describe('extractSubscriptionId', () => {
    it('reads the top-level id from a monitoring-webhook create response', () => {
        expect(extractSubscriptionId(fixture('monitoring-webhook-created.json'))).toBe(42);
    });

    it('reads subscription.id from a NACE create response', () => {
        expect(extractSubscriptionId(fixture('nace-subscription-created.json'))).toBe(7);
    });

    it('returns undefined when no id is present', () => {
        expect(extractSubscriptionId({ ok: true })).toBeUndefined();
        expect(extractSubscriptionId(null)).toBeUndefined();
    });
});

describe('buildMonitoringWebhookBody', () => {
    it('builds the WebhookSubscriptionCreate body', () => {
        expect(
            buildMonitoringWebhookBody({
                orgnr: '923609016',
                url: 'https://ap.example/hook',
                deliverySecret: 's3cret',
            }),
        ).toEqual({ orgnr: '923609016', url: 'https://ap.example/hook', delivery_key: 's3cret' });
    });

    it('omits delivery_key when no secret is set', () => {
        expect(buildMonitoringWebhookBody({ orgnr: '923609016', url: 'https://ap.example/hook' })).toEqual({
            orgnr: '923609016',
            url: 'https://ap.example/hook',
        });
    });
});

describe('buildNaceSubscriptionBody', () => {
    it('includes only non-empty filters and thresholds', () => {
        expect(
            buildNaceSubscriptionBody({
                naceCode: '47.110',
                url: 'https://ap.example/hook',
                events: ['created', 'status_changed'],
                aggregationMode: 'real_time',
                fylkeFilter: ['03', ' 11 '],
                kommuneFilter: [],
                landsdelFilter: undefined,
                minAnsatte: 5,
                minOmsetningNok: 0,
                deliverySecret: 'token-1',
            }),
        ).toEqual({
            nace_code: '47.110',
            url: 'https://ap.example/hook',
            bearer_token: 'token-1',
            aggregation_mode: 'real_time',
            events: ['created', 'status_changed'],
            fylke_filter: ['03', '11'],
            min_ansatte: 5,
        });
    });

    it('omits events entirely when empty (backend default = all types)', () => {
        const body = buildNaceSubscriptionBody({
            naceCode: 'G',
            url: 'https://ap.example/hook',
            events: [],
        });
        expect(body).toEqual({ nace_code: 'G', url: 'https://ap.example/hook' });
        expect('events' in body).toBe(false);
    });
});
