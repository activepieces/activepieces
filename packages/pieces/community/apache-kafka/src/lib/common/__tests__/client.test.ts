import { beforeEach, describe, expect, it, vi } from 'vitest'

const kafkaMock = vi.hoisted(() => {
  const adminConnect = vi.fn(async () => undefined)
  const adminDisconnect = vi.fn(async () => undefined)
  const describeCluster = vi.fn(async () => ({ brokers: [], controller: null, clusterId: 'cluster' }))
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
