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

  it('accepts the full aiMetadata bundle', () => {
    const action = createAction({
      name: 'find_email_by_query',
      displayName: 'Find email by query',
      description: 'Find an email by free-text query.',
      aiMetadata: {
        description: 'Find an email by free-text query — searches subject + body.',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            subject: { type: 'string' },
            from: { type: 'string' },
          },
          examples: [{ id: '19dc5c', subject: 'Invoice #43', from: 'billing@x.com' }],
        },
        idempotent: true,
      },
      props: {},
      run: async () => ({}),
    })

    expect(action.aiMetadata?.description).toContain('searches subject')
    expect(action.aiMetadata?.outputSchema).toMatchObject({ type: 'object' })
    expect(action.aiMetadata?.idempotent).toBe(true)
  })

  it('accepts a loose JSON Schema outputSchema for dynamic shapes', () => {
    const action = createAction({
      name: 'read_rows',
      displayName: 'Read rows',
      description: 'Read a range of cells from a sheet.',
      audience: 'ai',
      aiMetadata: {
        description: 'Read a cell range; shape depends on the range and render option.',
        outputSchema: {
          type: 'object',
          properties: {
            values: {
              type: 'array',
              items: { type: 'array' },
              description: 'Row-major cells; each cell is string | number | boolean depending on valueRenderOption.',
            },
          },
          additionalProperties: true,
          examples: [{ values: [['Name', 'Email'], ['Ada', 'ada@x.com']] }],
        },
      },
      props: {},
      run: async () => ({}),
    })

    expect(action.aiMetadata?.outputSchema).toMatchObject({
      type: 'object',
      properties: { values: { type: 'array' } },
    })
  })

  it('keeps the new fields optional — pieces without them still construct', () => {
    const action = createAction({
      name: 'legacy_action',
      displayName: 'Legacy action',
      description: 'A pre-v2 action with no audience / aiMetadata.',
      props: {},
      run: async () => 'ok',
    })

    expect(action.audience).toBeUndefined()
    expect(action.aiMetadata).toBeUndefined()
  })
})
