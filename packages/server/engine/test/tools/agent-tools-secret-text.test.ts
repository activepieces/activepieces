import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Property } from '@activepieces/pieces-framework'
import { ExecutionToolStatus, FieldControlMode, FlowActionType, StepOutputStatus } from '@activepieces/shared'

const {
  mockGenerateText,
  mockGetPieceAndActionOrThrow,
  mockHandle,
  mockSortPropertiesByDependencies,
} = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
  mockGetPieceAndActionOrThrow: vi.fn(),
  mockHandle: vi.fn(),
  mockSortPropertiesByDependencies: vi.fn(),
}))

vi.mock('ai', async () => {
  const actual = await vi.importActual<typeof import('ai')>('ai')
  return {
    ...actual,
    generateText: mockGenerateText,
    Output: {
      object: vi.fn((config: unknown) => config),
    },
    zodSchema: vi.fn((schema: unknown) => schema),
  }
})

vi.mock('../../src/lib/helper/piece-loader', () => ({
  pieceLoader: {
    getPieceAndActionOrThrow: mockGetPieceAndActionOrThrow,
  },
}))

vi.mock('../../src/lib/handler/flow-executor', () => ({
  flowExecutor: {
    getExecutorForAction: vi.fn(() => ({
      handle: mockHandle,
    })),
  },
}))

vi.mock('../../src/lib/helper/piece-helper', () => ({
  pieceHelper: {
    executeProps: vi.fn(),
  },
}))

vi.mock('../../src/lib/tools/tsort', () => ({
  tsort: {
    sortPropertiesByDependencies: mockSortPropertiesByDependencies,
  },
}))

vi.mock('../../src/lib/handler/context/engine-constants', () => ({
  EngineConstants: {
    DEV_PIECES: false,
    fromExecuteActionInput: vi.fn(() => ({})),
  },
}))

vi.mock('../../src/lib/handler/context/flow-execution-context', () => ({
  FlowExecutorContext: {
    empty: vi.fn(() => ({ steps: {}, tags: [] })),
  },
}))

import { agentTools } from '../../src/lib/tools/index'

describe('agentTools secret text support', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSortPropertiesByDependencies.mockReturnValue({
      0: ['email', 'password'],
    })

    mockGetPieceAndActionOrThrow.mockResolvedValue({
      pieceAction: {
        description: 'Create an affiliate in Tapfiliate',
        props: {
          email: Property.ShortText({
            displayName: 'Email',
            required: true,
          }),
          password: Property.SecretText({
            displayName: 'Password',
            required: true,
          }),
        },
      },
    })

    mockGenerateText.mockResolvedValue({
      output: {
        email: 'user@example.com',
        password: 'super-secret-password',
      },
    })

    mockHandle.mockResolvedValue({
      steps: {
        create_affiliate: {
          status: StepOutputStatus.SUCCEEDED,
          output: {
            id: 'affiliate_123',
          },
          errorMessage: undefined,
        },
      },
    })
  })

  it('does not fail when a tool action contains a SECRET_TEXT input property and redacts it from resolvedInput', async () => {
    const tools = await agentTools.tools({
      engineConstants: {
        projectId: 'project-id',
      } as never,
      tools: [
        {
          toolName: 'tapfiliate_create_affiliate',
          pieceMetadata: {
            pieceName: 'tapfiliate',
            pieceVersion: '0.1.0',
            actionName: 'create_affiliate',
            predefinedInput: {},
          },
        },
      ],
      model: {} as never,
    })

    const result = await tools.tapfiliate_create_affiliate.execute({
      instruction: 'Create an affiliate with email user@example.com and password super-secret-password',
    })

    expect(result.status).toBe(ExecutionToolStatus.SUCCESS)
    expect(result.errorMessage).toBeUndefined()
    expect(result.resolvedInput).toMatchObject({
      email: 'user@example.com',
      password: 'Redacted',
    })
    expect(mockHandle).toHaveBeenCalledWith(expect.objectContaining({
      action: expect.objectContaining({
        type: FlowActionType.PIECE,
        settings: expect.objectContaining({
          input: expect.objectContaining({
            password: 'super-secret-password',
          }),
        }),
      }),
    }))
  })

  it('redacts auth and predefined SECRET_TEXT values from the extraction prompt context', async () => {
    mockSortPropertiesByDependencies.mockReturnValue({
      0: ['email'],
    })

    mockGetPieceAndActionOrThrow.mockResolvedValue({
      pieceAction: {
        description: 'Create an affiliate in Tapfiliate',
        props: {
          email: Property.ShortText({
            displayName: 'Email',
            required: true,
          }),
          apiSecret: Property.SecretText({
            displayName: 'API Secret',
            required: false,
          }),
        },
      },
    })

    const tools = await agentTools.tools({
      engineConstants: {
        projectId: 'project-id',
      } as never,
      tools: [
        {
          toolName: 'tapfiliate_create_affiliate',
          pieceMetadata: {
            pieceName: 'tapfiliate',
            pieceVersion: '0.1.0',
            actionName: 'create_affiliate',
            predefinedInput: {
              auth: {
                type: 'SECRET_TEXT',
                secret_text: 'auth-super-secret',
              },
              fields: {
                apiSecret: {
                  mode: FieldControlMode.CHOOSE_YOURSELF,
                  value: 'field-super-secret',
                },
              },
            },
          },
        },
      ],
      model: {} as never,
    })

    await tools.tapfiliate_create_affiliate.execute({
      instruction: 'Create an affiliate with email user@example.com',
    })

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    const prompt = mockGenerateText.mock.calls[0][0].prompt as string
    expect(prompt).toContain('Redacted')
    expect(prompt).not.toContain('auth-super-secret')
    expect(prompt).not.toContain('field-super-secret')
  })
})
