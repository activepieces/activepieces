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
    expect(() => kafkaRecords.readOutboundMessage({ value: '' }, 0)).toThrow('Message 1 needs a value')
    expect(() => kafkaRecords.readOutboundMessage({ value: 'hello', partition: -1 }, 0)).toThrow('Partition must be a whole number')
  })
})
