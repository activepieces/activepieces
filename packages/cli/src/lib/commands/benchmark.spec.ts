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

    it('leaves auth and load fields undefined when not provided', () => {
        const config = benchmarkUtils.normalizeOptions({ url: 'http://x', body: '{}' });
        expect(config.apiKey).toBeUndefined();
        expect(config.email).toBeUndefined();
        expect(config.requests).toBeUndefined();
        expect(config.concurrency).toBeUndefined();
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

describe('benchmarkUtils.resolvePhases', () => {
    it('honours an explicit concurrency override', () => {
        const phases = benchmarkUtils.resolvePhases({ concurrency: 7, slots: 3 });
        expect(phases).toEqual([{ label: 'conc 7', connections: 7 }]);
    });

    it('derives a single matched phase from slots', () => {
        const phases = benchmarkUtils.resolvePhases({ slots: 4 });
        expect(phases).toHaveLength(1);
        expect(phases[0].connections).toBe(4);
    });

    it('falls back to a default when slots are unknown', () => {
        const phases = benchmarkUtils.resolvePhases({});
        expect(phases[0].connections).toBe(10);
    });
});

describe('benchmarkUtils.percentile', () => {
    it('returns 0 for an empty set and the right order statistic otherwise', () => {
        expect(benchmarkUtils.percentile([], 50)).toBe(0);
        expect(benchmarkUtils.percentile([10, 1, 5, 3, 9], 50)).toBe(5);
        expect(benchmarkUtils.percentile([10, 1, 5, 3, 9], 90)).toBe(10);
    });
});

describe('benchmarkUtils.validateSetup', () => {
    const machine = (props: Record<string, string>, cpu: number, ramGb: number) => ({
        status: 'ONLINE',
        information: { workerProps: props, totalCpuCores: cpu, totalAvailableRamInBytes: ramGb * 1024 * 1024 * 1024 },
    });

    it('passes the recommended shape and warns on drift', () => {
        const good = benchmarkUtils.validateSetup([machine({ EXECUTION_MODE: 'SANDBOX_CODE_ONLY', REUSE_SANDBOX: 'true', WORKER_CONCURRENCY: '1' }, 0.5, 1)]);
        expect(good.every((c) => c.status === 'PASS')).toBe(true);

        const bad = benchmarkUtils.validateSetup([machine({ EXECUTION_MODE: 'SANDBOX', REUSE_SANDBOX: 'false', WORKER_CONCURRENCY: '5' }, 4, 8)]);
        expect(bad.find((c) => c.dimension === 'sandbox mode')?.status).toBe('WARN');
        expect(bad.find((c) => c.dimension === 'worker concurrency')?.status).toBe('WARN');
    });

    it('warns when no workers are connected', () => {
        const checks = benchmarkUtils.validateSetup([]);
        expect(checks[0].status).toBe('WARN');
    });
});

describe('benchmarkUtils.aggregateTimeline', () => {
    const run = (queue: number, provision: number, boot: number, runMs: number) => ({
        timeline: { legs: [[
            { name: 'QUEUE' as const, durationMs: queue },
            { name: 'PROVISION' as const, durationMs: provision },
            { name: 'BOOT' as const, durationMs: boot },
            { name: 'RUN' as const, durationMs: runMs },
        ]] },
    });

    it('splits queue-wait (non-RUN phases) from service (RUN)', () => {
        const agg = benchmarkUtils.aggregateTimeline([run(100, 10, 5, 50), run(300, 10, 5, 60)]);
        expect(agg.sampleCount).toBe(2);
        expect(agg.serviceP50).toBe(60);
        // queue-wait per run = queue + provision + boot = 115 and 315
        expect(agg.queueWaitP50).toBe(315);
    });

    it('ignores runs without a timeline', () => {
        const agg = benchmarkUtils.aggregateTimeline([{ timeline: null }, run(1, 1, 1, 20)]);
        expect(agg.sampleCount).toBe(1);
        expect(agg.serviceP50).toBe(20);
    });
});
