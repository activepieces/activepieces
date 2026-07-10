import { describe, expect, it } from 'vitest';
import { benchmarkUtils } from './benchmark';

const baseOpts = { url: 'http://localhost:3000/', requests: '10', concurrency: '2', apiKey: 'k', projectId: 'p1', body: '{"x":1}' };

describe('benchmarkUtils.normalizeOptions', () => {
    it('parses valid options and strips the trailing slash', () => {
        const config = benchmarkUtils.normalizeOptions(baseOpts);
        expect(config.url).toBe('http://localhost:3000');
        expect(config.requests).toBe(10);
        expect(config.concurrency).toBe(2);
        expect(config.apiKey).toBe('k');
        expect(config.projectId).toBe('p1');
        expect(config.body).toBe('{"x":1}');
    });

    it('leaves auth fields undefined when not provided', () => {
        const config = benchmarkUtils.normalizeOptions({ url: 'http://x', requests: '1', concurrency: '1', body: '{}' });
        expect(config.apiKey).toBeUndefined();
        expect(config.email).toBeUndefined();
    });

    it('rejects non-positive / non-integer requests and concurrency', () => {
        expect(() => benchmarkUtils.normalizeOptions({ ...baseOpts, requests: '0' })).toThrow(/requests/);
        expect(() => benchmarkUtils.normalizeOptions({ ...baseOpts, requests: 'abc' })).toThrow(/requests/);
        expect(() => benchmarkUtils.normalizeOptions({ ...baseOpts, concurrency: '-1' })).toThrow(/concurrency/);
    });

    it('rejects a body that is not valid JSON', () => {
        expect(() => benchmarkUtils.normalizeOptions({ ...baseOpts, body: 'not-json' })).toThrow(/JSON/);
    });
});

describe('benchmarkUtils.toSummary', () => {
    it('maps an autocannon result and sums failures', () => {
        const result = {
            requests: { sent: 100, average: 250 },
            latency: { mean: 12, p50: 10, p90: 20, p99: 40, min: 5, max: 90 },
            duration: 4,
            '2xx': 98,
            non2xx: 1,
            errors: 1,
            timeouts: 0,
        };
        const s = benchmarkUtils.toSummary({ result, flowId: 'flow123', connections: 10 });
        expect(s.throughputReqSec).toBe(250);
        expect(s.p99Ms).toBe(40);
        expect(s.ok2xx).toBe(98);
        expect(s.failed).toBe(2);
    });
});
