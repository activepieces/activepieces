import { describe, expect, it } from 'vitest'
import { Property } from '../property'
import { createAction } from './action'

describe('createAction — v2 AI-ready contract fields', () => {
  it('accepts audience and exposes it on the returned action', () => {
    const action = createAction({
      name: 'find_email_by_query',
      displayName: 'Find email by query',
      description: 'Find an email by free-text query.',
      audience: 'ai',
      props: { query: Property.ShortText({ displayName: 'Query', required: true }) },
      run: async () => ({ ok: true }),
    })

    expect(action.audience).toBe('ai')
  })

  it('accepts the full infoForLLM bundle', () => {
    const action = createAction({
      name: 'find_email_by_query',
      displayName: 'Find email by query',
      description: 'Find an email by free-text query.',
      infoForLLM: {
        description: 'Find an email by free-text query — searches subject + body.',
        outputSchema: '{ id: string, subject: string, from: string }',
        idempotent: true,
      },
      props: {},
      run: async () => ({}),
    })

    expect(action.infoForLLM?.description).toContain('searches subject')
    expect(action.infoForLLM?.outputSchema).toContain('subject: string')
    expect(action.infoForLLM?.idempotent).toBe(true)
  })

  it('keeps the new fields optional — pieces without them still construct', () => {
    const action = createAction({
      name: 'legacy_action',
      displayName: 'Legacy action',
      description: 'A pre-v2 action with no audience / infoForLLM.',
      props: {},
      run: async () => 'ok',
    })

    expect(action.audience).toBeUndefined()
    expect(action.infoForLLM).toBeUndefined()
  })
})
