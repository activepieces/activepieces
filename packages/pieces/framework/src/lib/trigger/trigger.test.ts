import { TriggerStrategy } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { Property } from '../property'
import { createTrigger } from './trigger'

describe('createTrigger — v2 AI-ready contract', () => {
  it('accepts infoForLLM on a polling trigger and exposes it', () => {
    const trigger = createTrigger({
      name: 'new_email',
      displayName: 'New email',
      description: 'Fires when a new email arrives.',
      type: TriggerStrategy.POLLING,
      props: { label: Property.ShortText({ displayName: 'Label', required: false }) },
      sampleData: { id: '19dc5c', subject: 'Invoice #43' },
      infoForLLM: {
        description: 'Fires when a new email lands in the inbox. Use to react to incoming mail.',
        outputSchema: '{ id: string, subject: string, from: string, snippet: string }',
        idempotent: true,
      },
      onEnable: async () => { /* no-op */ },
      onDisable: async () => { /* no-op */ },
      run: async () => [],
    })

    expect(trigger.infoForLLM?.description).toContain('inbox')
    expect(trigger.infoForLLM?.outputSchema).toContain('subject: string')
    expect(trigger.infoForLLM?.idempotent).toBe(true)
  })

  it('accepts infoForLLM on a webhook trigger', () => {
    const trigger = createTrigger({
      name: 'new_message',
      displayName: 'New message',
      description: 'Fires on incoming webhook message.',
      type: TriggerStrategy.WEBHOOK,
      props: {},
      sampleData: { text: 'hello' },
      infoForLLM: {
        description: 'Fires on each incoming webhook payload.',
        outputSchema: '{ text: string }',
      },
      onEnable: async () => { /* no-op */ },
      onDisable: async () => { /* no-op */ },
      run: async () => [],
    })

    expect(trigger.infoForLLM?.description).toBe('Fires on each incoming webhook payload.')
    expect(trigger.infoForLLM?.idempotent).toBeUndefined()
  })

  it('keeps infoForLLM optional — pre-v2 triggers still construct', () => {
    const trigger = createTrigger({
      name: 'legacy_trigger',
      displayName: 'Legacy trigger',
      description: 'A pre-v2 trigger with no infoForLLM.',
      type: TriggerStrategy.POLLING,
      props: {},
      sampleData: {},
      onEnable: async () => { /* no-op */ },
      onDisable: async () => { /* no-op */ },
      run: async () => [],
    })

    expect(trigger.infoForLLM).toBeUndefined()
  })
})
