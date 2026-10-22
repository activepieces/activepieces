import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  const run = vi.fn(async (config: {
    eachMessage: (payload: {
      topic: string
      partition: number
      message: {
        key: Buffer | null
        value: Buffer | null
        offset: string
        timestamp: string
        headers?: Record<string, Buffer>
      }
    }) => Promise<void>
  }) => {
    await config.eachMessage({
      topic: 'orders',
      partition: 1,
      message: {
        key: Buffer.from('order-1'),
        value: Buffer.from('hello'),
        offset: '8',
        timestamp: '1710000000000',
        headers: { source: Buffer.from('checkout') },
      },
    })
  })
  return {
    adminConnect,
    adminDisconnect,
    describeCluster,
    fetchTopicOffsets,
    fetchOffsets,
    setOffsets,
    producerConnect,
    producerDisconnect,
    send,
    consumerConnect,
    consumerDisconnect,
    subscribe,
    commitOffsets,
    stop,
    run,
  }
})

vi.mock('kafkajs', () => ({
  logLevel: { NOTHING: 0 },
  Partitioners: {
    DefaultPartitioner: () => () => 0,
  },
  Kafka: class Kafka {
    admin() {
      return {
        connect: kafkaMock.adminConnect,
        disconnect: kafkaMock.adminDisconnect,
        describeCluster: kafkaMock.describeCluster,
        fetchTopicOffsets: kafkaMock.fetchTopicOffsets,
        fetchOffsets: kafkaMock.fetchOffsets,
        setOffsets: kafkaMock.setOffsets,
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

describe('kafkaClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('does not open a socket when the broker list is invalid', async () => {
    const result = await kafkaClient.validate({
      brokers: 'not-a-broker',
      securityProtocol: 'PLAINTEXT',
    })
    expect(result.valid).toBe(false)
    expect(kafkaMock.adminConnect).not.toHaveBeenCalled()
  })

  it('returns the partition and offset for each published message', async () => {
    const results = await kafkaClient.publishMessages({
      auth,
      topic: 'orders',
      messages: [
        { key: 'order-1', value: 'hello' },
        { value: 'world' },
      ],
    })
    expect(results).toEqual([
      { topic: 'orders', key: 'order-1', partition: 3, offset: '15' },
      { topic: 'orders', key: null, partition: 3, offset: '15' },
    ])
    expect(kafkaMock.send).toHaveBeenCalledTimes(2)
    expect(kafkaMock.producerDisconnect).toHaveBeenCalled()
  })

  it('commits the next offset only when the trigger run asks it to', async () => {
    const committed = await kafkaClient.consume({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      maxMessages: 1,
      pollTimeoutSeconds: 1,
      fromBeginning: false,
      commit: true,
    })
    expect(committed).toEqual([{
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

    kafkaMock.commitOffsets.mockClear()
    kafkaMock.setOffsets.mockClear()
    await kafkaClient.consume({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      maxMessages: 1,
      pollTimeoutSeconds: 1,
      fromBeginning: false,
      commit: false,
    })
    expect(kafkaMock.commitOffsets).not.toHaveBeenCalled()
    expect(kafkaMock.setOffsets).not.toHaveBeenCalled()
  })

  it('pins the start offset of every partition without a commit before a trigger run reads', async () => {
    await kafkaClient.consume({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      maxMessages: 1,
      pollTimeoutSeconds: 1,
      fromBeginning: false,
      commit: true,
    })
    expect(kafkaMock.setOffsets).toHaveBeenCalledWith({
      groupId: 'activepieces-orders',
      topic: 'orders',
      partitions: [{ partition: 0, offset: '20' }],
    })
    expect(kafkaMock.setOffsets.mock.invocationCallOrder[0]).toBeLessThan(kafkaMock.consumerConnect.mock.invocationCallOrder[0])
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

  it('returns only the committed batch when a message arrives while committing', async () => {
    const late = {
      topic: 'orders',
      partition: 1,
      message: {
        key: null,
        value: Buffer.from('late'),
        offset: '9',
        timestamp: '1710000000001',
      },
    }
    let deliver: ((payload: typeof late) => Promise<void>) | undefined
    kafkaMock.run.mockImplementationOnce(async (config) => {
      deliver = config.eachMessage
      await config.eachMessage({
        topic: 'orders',
        partition: 1,
        message: {
          key: Buffer.from('order-1'),
          value: Buffer.from('hello'),
          offset: '8',
          timestamp: '1710000000000',
        },
      })
    })
    kafkaMock.commitOffsets.mockImplementationOnce(async () => {
      await deliver?.(late)
    })

    const records = await kafkaClient.consume({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      maxMessages: 10,
      pollTimeoutSeconds: 5,
      fromBeginning: false,
      commit: true,
    })

    expect(records.map((record) => record.offset)).toEqual(['8'])
    expect(kafkaMock.commitOffsets).toHaveBeenCalledWith([
      { topic: 'orders', partition: 1, offset: '9' },
    ])
  })

  it('waits for the consumer to join the group before timing the poll', async () => {
    kafkaMock.run.mockImplementationOnce(async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500))
      setTimeout(() => {
        config.eachMessage({
          topic: 'orders',
          partition: 0,
          message: { key: null, value: Buffer.from('after join'), offset: '3', timestamp: '1710000000000' },
        }).catch(() => undefined)
      }, 50)
    })

    const records = await kafkaClient.consume({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      maxMessages: 10,
      pollTimeoutSeconds: 1,
      fromBeginning: false,
      commit: false,
    })

    expect(records.map((record) => record.payload)).toEqual(['after join'])
  })

  it('reports a consumer that fails to start', async () => {
    kafkaMock.run.mockRejectedValueOnce(new Error('Group coordinator not available'))

    await expect(kafkaClient.consume({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      maxMessages: 10,
      pollTimeoutSeconds: 1,
      fromBeginning: false,
      commit: false,
    })).rejects.toThrow()
    expect(kafkaMock.consumerDisconnect).toHaveBeenCalled()
  })

  it('returns a partial batch once messages stop arriving', async () => {
    const started = Date.now()
    const records = await kafkaClient.consume({
      auth,
      topic: 'orders',
      consumerGroup: 'activepieces-orders',
      maxMessages: 10,
      pollTimeoutSeconds: 20,
      fromBeginning: false,
      commit: false,
    })
    expect(records).toHaveLength(1)
    expect(Date.now() - started).toBeLessThan(2_000)
  })
})
