import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockViewer = vi.fn()

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    get viewer() {
      return mockViewer()
    }
  },
  LinearDocument: {},
}))

import { linearAuth } from '../index'

function validate(auth: string) {
  return linearAuth.validate!({ auth, server: {} as never })
}

function linearError(status: number, type: string) {
  return Object.assign(new Error('Linear rejected the request'), { status, type })
}

describe('linearAuth.validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a key that does not look like a Linear personal api key without calling Linear', async () => {
    const result = await validate('not-a-linear-key')

    expect(result).toEqual({ valid: false, error: 'Invalid API Key' })
    expect(mockViewer).not.toHaveBeenCalled()
  })

  it('rejects a well-formed key that Linear refuses, naming the action to take', async () => {
    mockViewer.mockRejectedValue(linearError(401, 'AuthenticationError'))

    const result = await validate('lin_api_revokedkeyrevokedkeyrevoked')

    expect(result.valid).toBe(false)
    expect(result.valid === false && result.error).toContain('Linear did not accept this API key')
  })

  it('accepts a key Linear accepts', async () => {
    mockViewer.mockResolvedValue({ id: 'user-1', admin: true })

    const result = await validate('lin_api_goodkeygoodkeygoodkeygoodkey')

    expect(result).toEqual({ valid: true })
  })

  it('accepts a key whose owner is not a workspace admin, so actions-only connections keep working', async () => {
    mockViewer.mockResolvedValue({ id: 'user-1', admin: false })

    const result = await validate('lin_api_nonadminnonadminnonadminnon')

    expect(result).toEqual({ valid: true })
  })

  it('separates an unreachable Linear from a refused key', async () => {
    mockViewer.mockRejectedValue(new Error('getaddrinfo ENOTFOUND api.linear.app'))

    const result = await validate('lin_api_goodkeygoodkeygoodkeygoodkey')

    expect(result.valid).toBe(false)
    expect(result.valid === false && result.error).toContain('Could not reach Linear')
  })
})
