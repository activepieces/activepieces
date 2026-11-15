import { describe, expect, it } from 'vitest'
import { kafkaRecords } from '../records'

describe('kafkaRecords', () => {
  it('flattens a consumed message into payload, key, partition, and offset', () => {
    const record = kafkaRecords.toRecord({
      topic: 'orders',
      partition: 2,
      message: {
        key: Buffer.from('order-1'),
        value: Buffer.from('{"id":"order-1"}'),
        offset: '41',
        timestamp: '1710000000000',
        headers: {
          source: Buffer.from('checkout'),
          trace: ['a', Buffer.from('b')],
        },
      },
    })

    expect(record).toEqual({
      topic: 'orders',
      partition: 2,
      offset: '41',
      key: 'order-1',
      payload: '{"id":"order-1"}',
      headers: { source: 'checkout', trace: 'a,b' },
      timestamp: '1710000000000',
    })
  })

  it('commits the next offset on each partition', () => {
    expect(kafkaRecords.commitPlan({
      topic: 'orders',
      records: [
        { partition: 0, offset: '4' },
        { partition: 0, offset: '5' },
        { partition: 1, offset: '9' },
      ],
    })).toEqual([
      { topic: 'orders', partition: 0, offset: '6' },
      { topic: 'orders', partition: 1, offset: '10' },
    ])
  })

  it('starts each partition without a commit at the chosen end of the topic', () => {
    const topicOffsets = [
      { partition: 0, low: '3', high: '20' },
      { partition: 1, low: '0', high: '9' },
      { partition: 2, low: '5', high: '5' },
    ]
    const committed = [
      { partition: 0, offset: '-1' },
      { partition: 1, offset: '7' },
    ]
    expect(kafkaRecords.startOffsetPlan({ topicOffsets, committed, fromBeginning: false })).toEqual([
      { partition: 0, offset: '20' },
      { partition: 2, offset: '5' },
    ])
    expect(kafkaRecords.startOffsetPlan({ topicOffsets, committed, fromBeginning: true })).toEqual([
      { partition: 0, offset: '3' },
      { partition: 2, offset: '5' },
    ])
  })

  it('returns one batch item or one item per message', () => {
    const records = [{
      topic: 'orders',
      partition: 0,
      offset: '1',
      key: null,
      payload: 'hello',
      headers: {},
      timestamp: '1',
    }]
    expect(kafkaRecords.toTriggerOutput({ records, topic: 'orders', batch: false })).toEqual(records)
    expect(kafkaRecords.toTriggerOutput({ records, topic: 'orders', batch: true })).toEqual([{
      topic: 'orders',
      message_count: 1,
      messages: records,
    }])
    expect(kafkaRecords.toTriggerOutput({ records: [], topic: 'orders', batch: true })).toEqual([])
  })

  it('reads outbound messages and rejects a missing value', () => {
    expect(kafkaRecords.readOutboundMessages([
      { key: 'order-1', value: 'hello', headers: { source: 'checkout' }, partition: 1 },
    ])).toEqual([
      { key: 'order-1', value: 'hello', headers: { source: 'checkout' }, partition: 1 },
    ])
    expect(() => kafkaRecords.readOutboundMessages([])).toThrow('Add at least one message')
    expect(() => kafkaRecords.readOutboundMessage({ value: { value: '' }, index: 0 })).toThrow('Message 1 needs a value')
    expect(() => kafkaRecords.readOutboundMessage({ value: { value: 'hello', partition: -1 }, index: 0 })).toThrow('Partition must be a whole number')
  })

  it('plans pending reads from committed offsets and skips caught-up partitions', () => {
    expect(kafkaRecords.pendingTargets({
      topicOffsets: [
        { partition: 0, low: '0', high: '10' },
        { partition: 1, low: '5', high: '7' },
        { partition: 2, low: '0', high: '4' },
      ],
      committed: [
        { partition: 0, offset: '10' },
        { partition: 1, offset: '2' },
        { partition: 2, offset: '1' },
      ],
    })).toEqual([
      { partition: 1, offset: '5', end: '7' },
      { partition: 2, offset: '1', end: '4' },
    ])
  })

  it('plans recent reads per partition and skips empty partitions', () => {
    expect(kafkaRecords.recentTargets({
      topicOffsets: [
        { partition: 0, low: '0', high: '10' },
        { partition: 1, low: '2', high: '3' },
        { partition: 2, low: '4', high: '4' },
      ],
      count: 5,
    })).toEqual([
      { partition: 0, offset: '5', end: '10' },
      { partition: 1, offset: '2', end: '3' },
    ])
  })

  it('orders sampled records newest first and keeps the requested count', () => {
    const record = { topic: 't', partition: 0, key: null, payload: 'x', headers: {} }
    expect(kafkaRecords.newestFirst({
      records: [
        { ...record, offset: '1', timestamp: '100' },
        { ...record, offset: '2', timestamp: '300' },
        { ...record, offset: '3', timestamp: '200' },
      ],
      count: 2,
    }).map((entry) => entry.offset)).toEqual(['2', '3'])
  })

  it('maps one send response to per-message offsets', () => {
    expect(kafkaRecords.publishResults({
      topic: 'orders',
      messages: [
        { value: 'a', partition: 1 },
        { value: 'b', partition: 1, key: 'k' },
      ],
      metadata: [{ topicName: 'orders', partition: 1, errorCode: 0, baseOffset: '41' }],
    })).toEqual([
      { topic: 'orders', key: null, partition: 1, offset: '41' },
      { topic: 'orders', key: 'k', partition: 1, offset: '42' },
    ])
  })
  it('re-applies the start policy when the committed offset is past the end of a truncated log', () => {
    const plan = kafkaRecords.startOffsetPlan({
      topicOffsets: [{ partition: 0, low: '0', high: '100' }, { partition: 1, low: '0', high: '50' }],
      committed: [{ partition: 0, offset: '1000' }, { partition: 1, offset: '40' }],
      fromBeginning: false,
    })
    expect(plan).toEqual([{ partition: 0, offset: '100' }])
  })

  it('knows when a sample window already starts at the beginning of every partition', () => {
    const topicOffsets = [{ partition: 0, low: '0', high: '3' }, { partition: 1, low: '5', high: '100' }]
    expect(kafkaRecords.reachesLogStart({ topicOffsets, targets: kafkaRecords.recentTargets({ topicOffsets, count: 5 }) })).toBe(false)
    expect(kafkaRecords.reachesLogStart({ topicOffsets, targets: kafkaRecords.recentTargets({ topicOffsets, count: 500 }) })).toBe(true)
  })
})
