import { describe, expect, it } from 'vitest'
import { kafkaConfig } from '../config'

const saslAuth = {
  brokers: 'kafka.internal:9092',
  securityProtocol: 'SASL_SSL',
  saslMechanism: 'plain',
  username: 'app',
  password: 'secret',
  rejectUnauthorized: true,
}

describe('kafkaConfig', () => {
  it('parses comma-separated brokers and rejects a missing port', () => {
    expect(kafkaConfig.parseBrokers(' kafka-1.internal:9092, kafka-2.internal:9093 ')).toEqual([
      'kafka-1.internal:9092',
      'kafka-2.internal:9093',
    ])
    expect(() => kafkaConfig.parseBrokers('kafka.internal')).toThrow('host:port')
  })

  it('requires SASL credentials only for SASL protocols', () => {
    expect(kafkaConfig.requirementError({
      brokers: 'kafka.internal:9092',
      securityProtocol: 'PLAINTEXT',
    })).toBeUndefined()
    expect(kafkaConfig.requirementError({
      ...saslAuth,
      username: ' ',
    })).toMatch('SASL username and password')
    expect(kafkaConfig.requirementError({
      ...saslAuth,
      saslMechanism: undefined,
    })).toMatch('SASL mechanism')
  })

  it('builds SSL and SASL options from the security protocol', () => {
    const plaintext = kafkaConfig.build({
      brokers: 'kafka.internal:9092',
      securityProtocol: 'PLAINTEXT',
    })
    expect(plaintext.brokers).toEqual(['kafka.internal:9092'])
    expect(plaintext.ssl).toBeUndefined()
    expect(plaintext.sasl).toBeUndefined()

    const secured = kafkaConfig.build({
      ...saslAuth,
      caCertificate: '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----',
    })
    expect(secured.sasl).toEqual({ mechanism: 'plain', username: 'app', password: 'secret' })
    expect(secured.ssl).toMatchObject({
      rejectUnauthorized: true,
      ca: ['-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----'],
    })
  })

  it('turns broker failures into an actionable message', () => {
    expect(kafkaConfig.describeError({
      error: new Error('Connection timeout'),
      brokers: 'kafka.internal:9092',
      topic: 'orders',
    })).toMatch('Could not reach Kafka topic "orders"')
    expect(kafkaConfig.describeError({
      error: new Error('SASL authentication failed'),
      brokers: 'kafka.internal:9092',
    })).toMatch('Kafka authentication failed')
    expect(kafkaConfig.describeError({
      error: new Error('Enter a topic name, for example orders.'),
      brokers: 'kafka.internal:9092',
    })).toBe('Enter a topic name, for example orders.')
  })
})
