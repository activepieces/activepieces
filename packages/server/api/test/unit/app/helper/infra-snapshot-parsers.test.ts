import { describe, expect, it } from 'vitest'
import { infraSnapshotParsers } from '../../../../src/app/helper/infra-snapshot-parsers'

const REDIS_INFO = [
    '# Memory\r',
    'used_memory:1048576\r',
    'mem_fragmentation_ratio:1.42\r',
    'rdb_last_bgsave_status:ok\r',
    '\r',
    '# Keyspace\r',
    'db0:keys=120,expires=80,avg_ttl=1000\r',
    'db1:keys=30,expires=0,avg_ttl=0\r',
].join('\n')

describe('infraSnapshotParsers.parseInfoSections', () => {
    it('parses redis INFO lines and drops comments and blanks', () => {
        const info = infraSnapshotParsers.parseInfoSections(REDIS_INFO)

        expect(info['used_memory']).toBe('1048576')
        expect(info['mem_fragmentation_ratio']).toBe('1.42')
        expect(info['rdb_last_bgsave_status']).toBe('ok')
        expect(Object.keys(info)).not.toContain('# Memory')
    })

    it('keeps values that contain a colon', () => {
        const info = infraSnapshotParsers.parseInfoSections('master_host:10.0.0.1:6379')

        expect(info['master_host']).toBe('10.0.0.1:6379')
    })
})

describe('infraSnapshotParsers.sumKeyspace', () => {
    it('totals keys across databases and counts the ones with no ttl', () => {
        const keyspace = infraSnapshotParsers.sumKeyspace(infraSnapshotParsers.parseInfoSections(REDIS_INFO))

        expect(keyspace).toEqual({ keys: 150, keysWithoutTtl: 70 })
    })

    it('reports zero when no keyspace section is present', () => {
        expect(infraSnapshotParsers.sumKeyspace({ used_memory: '1' })).toEqual({ keys: 0, keysWithoutTtl: 0 })
    })
})

describe('infraSnapshotParsers.parseFieldList', () => {
    it('splits a commandstats value into fields', () => {
        const fields = infraSnapshotParsers.parseFieldList('calls=13,usec=260,usec_per_call=20.00,rejected_calls=0,failed_calls=1')

        expect(fields).toEqual({
            calls: '13',
            usec: '260',
            usec_per_call: '20.00',
            rejected_calls: '0',
            failed_calls: '1',
        })
    })
})

describe('infraSnapshotParsers.asRows', () => {
    it('unwraps the [rows, count] shape node-postgres returns for some statements', () => {
        expect(infraSnapshotParsers.asRows([[{ calls: 1 }], 1])).toEqual([{ calls: 1 }])
    })

    it('passes a plain rows array through', () => {
        expect(infraSnapshotParsers.asRows([{ calls: 1 }, { calls: 2 }])).toEqual([{ calls: 1 }, { calls: 2 }])
    })

    it('returns an empty list for a non-array result', () => {
        expect(infraSnapshotParsers.asRows(undefined)).toEqual([])
    })
})

describe('infraSnapshotParsers.numericFields', () => {
    it('camel cases keys and coerces the strings node-postgres returns for bigint columns', () => {
        const fields = infraSnapshotParsers.numericFields({
            seq_tup_read: '9007199254740',
            n_dead_tup: 12,
            table: 'flow_run',
            vacuum_age_seconds: null,
        })

        expect(fields).toEqual({ seqTupRead: 9007199254740, nDeadTup: 12 })
    })
})

describe('infraSnapshotParsers.pickNumbers', () => {
    it('keeps only the requested numeric keys', () => {
        const fields = infraSnapshotParsers.pickNumbers({
            info: { used_memory: '1048576', rdb_last_bgsave_status: 'ok' },
            keys: ['used_memory', 'rdb_last_bgsave_status', 'evicted_keys'],
        })

        expect(fields).toEqual({ usedMemory: 1048576 })
    })
})
