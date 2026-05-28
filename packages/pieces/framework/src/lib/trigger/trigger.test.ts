import { TriggerStrategy } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { Property } from '../property'
import { createTrigger } from './trigger'

describe('createTrigger — v2 AI-ready contract', () => {
  it('accepts aiMetadata on a polling trigger and exposes it', () => {
    const trigger = createTrigger({
      name: 'new_email',
      displayName: 'New email',
      description: 'Fires when a new email arrives.',
      type: TriggerStrategy.POLLING,
      props: { label: Property.ShortText({ displayName: 'Label', required: false }) },
      sampleData: { id: '19dc5c', subject: 'Invoice #43' },
      aiMetadata: {
        description: 'Fires when a new email lands in the inbox. Use to react to incoming mail.',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            subject: { type: 'string' },
            from: { type: 'string' },
            snippet: { type: 'string' },
          },
        },
        idempotent: true,
      },
      onEnable: async () => { /* no-op */ },
      onDisable: async () => { /* no-op */ },
      run: async () => [],
    })

    expect(trigger.aiMetadata?.description).toContain('inbox')
    expect(trigger.aiMetadata?.outputSchema).toMatchObject({ type: 'object' })
    expect(trigger.aiMetadata?.idempotent).toBe(true)
  })

  it('accepts aiMetadata on a webhook trigger', () => {
    const trigger = createTrigger({
      name: 'new_message',
      displayName: 'New message',
      description: 'Fires on incoming webhook message.',
      type: TriggerStrategy.WEBHOOK,
      props: {},
      sampleData: { text: 'hello' },
      aiMetadata: {
        description: 'Fires on each incoming webhook payload.',
        outputSchema: {
          type: 'object',
          properties: { text: { type: 'string' } },
        },
      },
      onEnable: async () => { /* no-op */ },
      onDisable: async () => { /* no-op */ },
      run: async () => [],
    })

    expect(trigger.aiMetadata?.description).toBe('Fires on each incoming webhook payload.')
    expect(trigger.aiMetadata?.idempotent).toBeUndefined()
  })

  it('keeps aiMetadata optional — pre-v2 triggers still construct', () => {
    const trigger = createTrigger({
      name: 'legacy_trigger',
      displayName: 'Legacy trigger',
      description: 'A pre-v2 trigger with no aiMetadata.',
      type: TriggerStrategy.POLLING,
      props: {},
      sampleData: {},
      onEnable: async () => { /* no-op */ },
      onDisable: async () => { /* no-op */ },
      run: async () => [],
    })

    expect(trigger.aiMetadata).toBeUndefined()
  })
})
