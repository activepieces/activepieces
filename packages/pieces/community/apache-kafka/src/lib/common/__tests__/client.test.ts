import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockMessage = {
  key: Buffer | null
  value: Buffer | null
  offset: string
  timestamp: string
  headers?: Record<string, Buffer>
}

type MockBatch = { topic: string, partition: number, messages: MockMessage[], lastOffset: () => string }

const kafkaMock = vi.hoisted(() => {
  const adminConnect = vi.fn(async () => undefined)
  const adminDisconnect = vi.fn(async () => undefined)
  const describeCluster = vi.fn(async () => ({ brokers: [], controller: null, clusterId: 'cluster' }))
  const fetchTopicOffsets = vi.fn(async () => [
    { partition: 0, offset: '20', low: '3', high: '20' },
    { partition: 1, offset: '9', low: '0', high: '9' },
  ])
  const fetchOffsets = vi.fn(async () => [{
    topic: 'orders',
    partitions: [
      { partition: 0, offset: '-1', metadata: null },
      { partition: 1, offset: '8', metadata: null },
    ],
  }])
  const setOffsets = vi.fn(async () => undefined)
  const deleteGroups = vi.fn(async () => undefined)
  const fetchTopicMetadata = vi.fn(async () => ({
    topics: [{ name: 'orders', partitions: [{ partitionId: 0, leader: 1 }, { partitionId: 1, leader: 1 }] }],
  }))
  const kafkaConfigs: unknown[] = []
  const producerConnect = vi.fn(async () => undefined)
  const producerDisconnect = vi.fn(async () => undefined)
  const send = vi.fn(async () => [{
    topicName: 'orders',
    partition: 3,
    errorCode: 0,
    baseOffset: '15',
  }])
  const consumerConnect = vi.fn(async () => undefined)
  const consumerDisconnect = vi.fn(async () => undefined)
  const subscribe = vi.fn(async () => undefined)
  const commitOffsets = vi.fn(async () => undefined)
  const stop = vi.fn(async () => undefined)
  const assignment: { orders: number[] } = { orders: [0, 1] }
  const joinListeners: ((event: { payload: { memberAssignment: Record<string, number[]> } }) => void)[] = []
  const on = vi.fn((_event: string, listener: (event: { payload: { memberAssignment: Record<string, number[]> } }) => void) => {
    joinListeners.push(listener)
  })
  const resolveOffset = vi.fn()
  const asBatch = ({ topic, partition, message, lastOffset }: { topic: string, partition: number, message: MockMessage, lastOffset?: string }) => ({
    batch: { topic, partition, messages: [message], lastOffset: () => lastOffset ?? message.offset },
    resolveOffset,
  })
  const run = vi.fn(async (config: {
    eachBatch: (payload: { batch: MockBatch, resolveOffset: (offset: string) => void }) => Promise<void>
  }) => {
    joinListeners.forEach((listener) => listener({ payload: { memberAssignment: assignment } }))
    await config.eachBatch(asBatch({
      topic: 'orders',
      partition: 1,
      message: {
        key: Buffer.from('order-1'),
        value: Buffer.from('hello'),
        offset: '8',
        timestamp: '1710000000000',
        headers: { source: Buffer.from('checkout') },
      },
    }))
  })
  return {
    asBatch,
    resolveOffset,
    adminConnect,
    adminDisconnect,
    describeCluster,
    fetchTopicOffsets,
    fetchOffsets,
    setOffsets,
    deleteGroups,
    fetchTopicMetadata,
    kafkaConfigs,
    producerConnect,
    producerDisconnect,
    send,
    consumerConnect,
    consumerDisconnect,
    subscribe,
    commitOffsets,
    stop,
    on,
    assignment,
    joinListeners,
    run,
  }
})

vi.mock('kafkajs', () => ({
  logLevel: { NOTHING: 0 },
  Partitioners: {
    DefaultPartitioner: () => ({ message }: { message: { key?: string } }) => (message.key === 'a' ? 0 : 1),
  },
  Kafka: class Kafka {
    constructor(config: unknown) {
      kafkaMock.kafkaConfigs.push(config)
    }

    admin() {
      return {
        connect: kafkaMock.adminConnect,
        disconnect: kafkaMock.adminDisconnect,
        describeCluster: kafkaMock.describeCluster,
        fetchTopicOffsets: kafkaMock.fetchTopicOffsets,
        fetchOffsets: kafkaMock.fetchOffsets,
        setOffsets: kafkaMock.setOffsets,
        deleteGroups: kafkaMock.deleteGroups,
        fetchTopicMetadata: kafkaMock.fetchTopicMetadata,
      }
    }

    producer() {
      return {
        connect: kafkaMock.producerConnect,
        disconnect: kafkaMock.producerDisconnect,
        send: kafkaMock.send,
      }
    }

    consumer() {
      return {
        connect: kafkaMock.consumerConnect,
        disconnect: kafkaMock.consumerDisconnect,
        subscribe: kafkaMock.subscribe,
        commitOffsets: kafkaMock.commitOffsets,
        stop: kafkaMock.stop,
        on: kafkaMock.on,
        events: { GROUP_JOIN: 'consumer.group_join' },
        run: kafkaMock.run,
      }
    }
  },
}))

import { kafkaClient } from '../client'

const auth = {
  brokers: 'kafka.internal:9092',
  securityProtocol: 'PLAINTEXT',
}

const pollInput = {
  auth,
  topic: 'orders',
  consumerGroup: 'activepieces-orders',
  maxMessages: 10,
  pollTimeoutSeconds: 20,
  fromBeginning: false,
}

describe('kafkaClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    kafkaMock.joinListeners.length = 0
    kafkaMock.assignment.orders = [0, 1]
    kafkaMock.kafkaConfigs.length = 0
  })

  it('rejects a connection when the cluster cannot be described', async () => {
    kafkaMock.describeCluster.mockRejectedValueOnce(new Error('SASL authentication failed'))
    const result = await kafkaClient.validate({
      ...auth,
      securityProtocol: 'SASL_SSL',
      saslMechanism: 'plain',
      username: 'app',
      password: 'secret',
    })
    expect(result).toEqual({
      valid: false,
      error: expect.stringContaining('Kafka authentication failed'),
    })
    expect(kafkaMock.adminDisconnect).toHaveBeenCalled()
  })

  it('validates with a single short connection attempt', async () => {
    await kafkaClient.validate(auth)
    expect(kafkaMock.kafkaConfigs[0]).toMatchObject({
      connectionTimeout: 5_000,
      retry: { retries: 0 },
    })
  })

  it('does not open a socket when the broker list is invalid', async () => {
    const result = await kafkaClient.validate({
      brokers: 'not-a-broker',
      securityProtocol: 'PLAINTEXT',
    })
    expect(result.valid).toBe(false)
    expect(kafkaMock.adminConnect).not.toHaveBeenCalled()
  })

  it('publishes every message in one send and derives each offset from the partition base offset', async () => {
    kafkaMock.send.mockResolvedValueOnce([
      { topicName: 'orders', partition: 0, errorCode: 0, baseOffset: '10' },
      { topicName: 'orders', partition: 1, errorCode: 0, baseOffset: '20' },
    ])
    const results = await kafkaClient.publishMessages({
      auth,
      topic: 'orders',
      messages: [
        { key: 'a', value: 'first' },
        { key: 'b', value: 'second' },
        { key: 'a', value: 'third' },
      ],
    })
    expect(kafkaMock.send).toHaveBeenCalledTimes(1)
    expect(kafkaMock.send).toHaveBeenCalledWith({
      topic: 'orders',
      acks: -1,
      messages: [
        expect.objectContaining({ key: 'a', value: 'first', partition: 0 }),
        expect.objectContaining({ key: 'b', value: 'second', partition: 1 }),
        expect.objectContaining({ key: 'a', value: 'third', partition: 0 }),
      ],
    })
    expect(results).toEqual([
      { topic: 'orders', key: 'a', partition: 0, offset: '10' },
      { topic: 'orders', key: 'b', partition: 1, offset: '20' },
      { topic: 'orders', key: 'a', partition: 0, offset: '11' },
    ])
    expect(kafkaMock.producerDisconnect).toHaveBeenCalled()
  })

  it('publishes a single message without fetching topic metadata', async () => {
    const results = await kafkaClient.publishMessages({
      auth,
      topic: 'orders',
      messages: [{ value: 'hello' }],
    })
    expect(results).toEqual([{ topic: 'orders', key: null, partition: 3, offset: '15' }])
    expect(kafkaMock.fetchTopicMetadata).not.toHaveBeenCalled()
  })

  it('fails when the broker rejects a partition', async () => {
    kafkaMock.send.mockResolvedValueOnce([
      { topicName: 'orders', partition: 0, errorCode: 0, baseOffset: '10' },
      { topicName: 'orders', partition: 1, errorCode: 6, baseOffset: '-1' },
    ])
    await expect(kafkaClient.publishMessages({
      auth,
      topic: 'orders',
      messages: [{ key: 'a', value: 'first' }, { key: 'b', value: 'second' }],
    })).rejects.toThrow('Broker returned error code 6')
  })

  it('returns at once without joining the group when nothing is pending', async () => {
    kafkaMock.fetchOffsets.mockResolvedValueOnce([{
      topic: 'orders',
      partitions: [
        { partition: 0, offset: '20', metadata: null },
        { partition: 1, offset: '9', metadata: null },
      ],
    }])
    const records = await kafkaClient.poll(pollInput)
    expect(records).toEqual([])
    expect(kafkaMock.consumerConnect).not.toHaveBeenCalled()
    expect(kafkaMock.setOffsets).not.toHaveBeenCalled()
  })

  it('reads up to the pending end, commits the next offset and returns without waiting for the timeout', async () => {
    const started = Date.now()
    const records = await kafkaClient.poll(pollInput)
    expect(records).toEqual([{
      topic: 'orders',
      partition: 1,
      offset: '8',
      key: 'order-1',
      payload: 'hello',
      headers: { source: 'checkout' },
      timestamp: '1710000000000',
    }])
    expect(kafkaMock.commitOffsets).toHaveBeenCalledWith([
      { topic: 'orders', partition: 1, offset: '9' },
    ])
    expect(Date.now() - started).toBeLessThan(1_000)
  })

  it('pins the start offset of every partition without a commit before a trigger run reads', async () => {
    await kafkaClient.poll(pollInput)
    expect(kafkaMock.setOffsets).toHaveBeenCalledWith({
      groupId: 'activepieces-orders',
      topic: 'orders',
      partitions: [{ partition: 0, offset: '20' }],
    })
    expect(kafkaMock.setOffsets.mock.invocationCallOrder[0]).toBeLessThan(kafkaMock.consumerConnect.mock.invocationCallOrder[0])
  })

  it('reads the group commit before the topic end so another member committing past an old end is not reset', async () => {
    kafkaMock.fetchOffsets.mockResolvedValueOnce([{
      topic: 'orders',
      partitions: [
        { partition: 0, offset: '25', metadata: null },
        { partition: 1, offset: '9', metadata: null },
      ],
    }])
    kafkaMock.fetchTopicOffsets.mockResolvedValueOnce([
      { partition: 0, offset: '25', low: '3', high: '25' },
      { partition: 1, offset: '9', low: '0', high: '9' },
    ])
    await kafkaClient.pinStartOffsets({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      fromBeginning: true,
    })
    expect(kafkaMock.fetchOffsets.mock.invocationCallOrder[0]).toBeLessThan(kafkaMock.fetchTopicOffsets.mock.invocationCallOrder[0])
    expect(kafkaMock.setOffsets).not.toHaveBeenCalled()
  })

  it('leaves the group untouched when every partition already has a commit', async () => {
    kafkaMock.fetchOffsets.mockResolvedValueOnce([{
      topic: 'orders',
      partitions: [
        { partition: 0, offset: '20', metadata: null },
        { partition: 1, offset: '9', metadata: null },
      ],
    }])
    await kafkaClient.pinStartOffsets({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      fromBeginning: true,
    })
    expect(kafkaMock.setOffsets).not.toHaveBeenCalled()
    expect(kafkaMock.adminDisconnect).toHaveBeenCalled()
  })

  it('samples recent messages through a throwaway group without committing or touching the live group', async () => {
    const records = await kafkaClient.sample({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      count: 5,
      pollTimeoutSeconds: 1,
    })
    expect(records.map((record) => record.offset)).toEqual(['8'])
    const [setCall] = kafkaMock.setOffsets.mock.calls
    expect(setCall[0]).toMatchObject({
      topic: 'orders',
      partitions: [{ partition: 0, offset: '15' }, { partition: 1, offset: '4' }],
    })
    expect(setCall[0].groupId).toMatch(/^activepieces-orders-activepieces-test-/)
    expect(kafkaMock.fetchOffsets).not.toHaveBeenCalled()
    expect(kafkaMock.commitOffsets).not.toHaveBeenCalled()
    expect(kafkaMock.deleteGroups).toHaveBeenCalledWith([setCall[0].groupId])
  })

  it('samples nothing from an empty topic without starting a consumer', async () => {
    kafkaMock.fetchTopicOffsets.mockResolvedValueOnce([{ partition: 0, offset: '0', low: '0', high: '0' }])
    const records = await kafkaClient.sample({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      count: 5,
      pollTimeoutSeconds: 5,
    })
    expect(records).toEqual([])
    expect(kafkaMock.consumerConnect).not.toHaveBeenCalled()
  })

  it('returns only the committed batch when a message arrives while committing', async () => {
    kafkaMock.fetchTopicOffsets.mockResolvedValueOnce([
      { partition: 0, offset: '20', low: '3', high: '20' },
      { partition: 1, offset: '12', low: '0', high: '12' },
    ])
    const late = {
      topic: 'orders',
      partition: 1,
      message: { key: null, value: Buffer.from('late'), offset: '9', timestamp: '1710000000001' },
    }
    let deliver: ((payload: { batch: MockBatch, resolveOffset: (offset: string) => void }) => Promise<void>) | undefined
    kafkaMock.run.mockImplementationOnce(async (config) => {
      deliver = config.eachBatch
      await config.eachBatch(kafkaMock.asBatch({
        topic: 'orders',
        partition: 1,
        message: { key: Buffer.from('order-1'), value: Buffer.from('hello'), offset: '8', timestamp: '1710000000000' },
      }))
    })
    kafkaMock.commitOffsets.mockImplementationOnce(async () => {
      await deliver?.(kafkaMock.asBatch(late))
    })

    const records = await kafkaClient.poll({ ...pollInput, pollTimeoutSeconds: 1 })

    expect(records.map((record) => record.offset)).toEqual(['8'])
    expect(kafkaMock.commitOffsets).toHaveBeenCalledWith([
      { topic: 'orders', partition: 1, offset: '9' },
    ])
  })

  it('waits for the consumer to join the group before timing the poll', async () => {
    kafkaMock.run.mockImplementationOnce(async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500))
      kafkaMock.joinListeners.forEach((listener) => listener({ payload: { memberAssignment: kafkaMock.assignment } }))
      setTimeout(() => {
        config.eachBatch(kafkaMock.asBatch({
          topic: 'orders',
          partition: 1,
          message: { key: null, value: Buffer.from('after join'), offset: '8', timestamp: '1710000000000' },
        })).catch(() => undefined)
      }, 50)
    })

    const records = await kafkaClient.poll({ ...pollInput, pollTimeoutSeconds: 1 })

    expect(records.map((record) => record.payload)).toEqual(['after join'])
  })

  it('does not wait for partitions another group member owns', async () => {
    kafkaMock.fetchOffsets.mockResolvedValueOnce([{
      topic: 'orders',
      partitions: [
        { partition: 0, offset: '10', metadata: null },
        { partition: 1, offset: '8', metadata: null },
      ],
    }])
    kafkaMock.assignment.orders = [1]
    const startedAt = Date.now()

    const records = await kafkaClient.poll({ ...pollInput, pollTimeoutSeconds: 5 })

    expect(records.map((record) => record.offset)).toEqual(['8'])
    expect(Date.now() - startedAt).toBeLessThan(2_000)
  })

  it('explains the prefixed ACL when the broker refuses the test group', async () => {
    kafkaMock.setOffsets.mockRejectedValueOnce(Object.assign(new Error('Not authorized to access group'), { type: 'GROUP_AUTHORIZATION_FAILED' }))

    await expect(kafkaClient.sample({ auth, topic: 'orders', consumerGroup: 'activepieces-orders', count: 5, pollTimeoutSeconds: 1 }))
      .rejects.toThrow(/PREFIXED group ACL on "activepieces-orders"/)
  })

  it('finishes and commits past a trailing transaction marker without waiting for the timeout', async () => {
    kafkaMock.fetchTopicOffsets.mockResolvedValueOnce([
      { partition: 0, offset: '20', low: '3', high: '20' },
      { partition: 1, offset: '10', low: '0', high: '10' },
    ])
    kafkaMock.run.mockImplementationOnce(async (config) => {
      kafkaMock.joinListeners.forEach((listener) => listener({ payload: { memberAssignment: kafkaMock.assignment } }))
      await config.eachBatch(kafkaMock.asBatch({
        topic: 'orders',
        partition: 1,
        message: { key: null, value: Buffer.from('last real'), offset: '8', timestamp: '1710000000000' },
        lastOffset: '9',
      }))
    })
    const startedAt = Date.now()

    const records = await kafkaClient.poll({ ...pollInput, pollTimeoutSeconds: 5 })

    expect(records.map((record) => record.offset)).toEqual(['8'])
    expect(kafkaMock.commitOffsets).toHaveBeenCalledWith([{ topic: 'orders', partition: 1, offset: '10' }])
    expect(kafkaMock.resolveOffset.mock.calls.map(([offset]) => offset)).toEqual(['8', '9'])
    expect(Date.now() - startedAt).toBeLessThan(2_000)
  })

  it('reads a partition across two fetched batches and resolves each offset', async () => {
    kafkaMock.fetchTopicOffsets.mockResolvedValueOnce([
      { partition: 0, offset: '20', low: '3', high: '20' },
      { partition: 1, offset: '10', low: '0', high: '10' },
    ])
    kafkaMock.run.mockImplementationOnce(async (config) => {
      kafkaMock.joinListeners.forEach((listener) => listener({ payload: { memberAssignment: kafkaMock.assignment } }))
      await config.eachBatch(kafkaMock.asBatch({ topic: 'orders', partition: 1, message: { key: null, value: Buffer.from('a'), offset: '8', timestamp: '1710000000000' } }))
      await config.eachBatch(kafkaMock.asBatch({ topic: 'orders', partition: 1, message: { key: null, value: Buffer.from('b'), offset: '9', timestamp: '1710000000001' } }))
    })

    const records = await kafkaClient.poll({ ...pollInput, pollTimeoutSeconds: 5 })

    expect(records.map((record) => record.payload)).toEqual(['a', 'b'])
    expect(kafkaMock.resolveOffset.mock.calls.map(([offset]) => offset)).toEqual(['8', '8', '9', '9'])
    expect(kafkaMock.commitOffsets).toHaveBeenCalledWith([{ topic: 'orders', partition: 1, offset: '10' }])
  })

  it('reports a consumer that fails to start', async () => {
    kafkaMock.run.mockRejectedValueOnce(new Error('Group coordinator not available'))

    await expect(kafkaClient.poll({ ...pollInput, pollTimeoutSeconds: 1 })).rejects.toThrow()
    expect(kafkaMock.consumerDisconnect).toHaveBeenCalled()
  })
})
