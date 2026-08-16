import { AgentOutputField, AgentTool } from '@activepieces/core-execution'
import { AIProviderName, ApId, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'
import { ColorName } from '../../management/project/project'

const MAX_AGENT_TEXT_LENGTH = 51_200
const MAX_AGENT_TOOLS = 100
const MAX_AGENT_OUTPUT_FIELDS = 50
const MAX_AGENT_STEP_BUDGET = 1_000
const MAX_AGENT_SHARED_MEMBERS = 200
const MAX_AGENT_PAGE_SIZE = 100
const DEFAULT_AGENT_MAX_STEPS = 20

enum AgentVisibility {
    PROJECT = 'PROJECT',
    RESTRICTED = 'RESTRICTED',
}

enum AgentIcon {
    BOT = 'bot',
    SPARKLES = 'sparkles',
    MESSAGE = 'message-square',
    USERS = 'users',
    BOOK = 'book-open',
    CHART = 'chart-line',
    CALENDAR = 'calendar',
    MAIL = 'mail',
    GLOBE = 'globe',
    FILE = 'file-text',
    SEARCH = 'search',
    ZAP = 'zap',
}

const AgentConfig = z.object({
    instructions: z.string().max(MAX_AGENT_TEXT_LENGTH),
    provider: Nullable(z.enum(AIProviderName)),
    modelName: Nullable(z.string()),
    maxSteps: z.number().int().positive().max(MAX_AGENT_STEP_BUDGET).default(DEFAULT_AGENT_MAX_STEPS),
    tools: z.array(AgentTool).max(MAX_AGENT_TOOLS).default([]),
    structuredOutput: z.array(AgentOutputField).max(MAX_AGENT_OUTPUT_FIELDS).default([]),
})

const Agent = z.object({
    ...BaseModelSchema,
    projectId: ApId,
    ownerId: ApId,
    externalId: z.string(),
    displayName: z.string(),
    description: Nullable(z.string()),
    icon: z.enum(AgentIcon),
    color: z.enum(ColorName),
    visibility: z.enum(AgentVisibility),
    sharedWithUserIds: z.array(ApId),
    draft: AgentConfig,
    published: Nullable(AgentConfig),
})

const CreateAgentRequest = z.object({
    projectId: ApId,
    displayName: z.string().min(1, formErrors.required),
    description: Nullable(z.string()),
    icon: z.enum(AgentIcon),
    color: z.enum(ColorName),
    visibility: z.enum(AgentVisibility).optional(),
    sharedWithUserIds: z.array(ApId).max(MAX_AGENT_SHARED_MEMBERS).optional(),
    draft: AgentConfig,
})

const UpdateAgentRequest = CreateAgentRequest.omit({ projectId: true }).partial()

const AgentTemplate = z.object({
    id: z.string(),
    displayName: z.string(),
    description: z.string(),
    icon: z.enum(AgentIcon),
    color: z.enum(ColorName),
    instructions: z.string(),
})

const DraftAgentRequest = z.object({
    projectId: ApId,
    prompt: z.string().min(1, formErrors.required).max(MAX_AGENT_TEXT_LENGTH),
})

const DraftAgentResponse = z.object({
    displayName: z.string(),
    description: z.string(),
    icon: z.enum(AgentIcon),
    color: z.enum(ColorName),
    instructions: z.string(),
})

const ListAgentsRequest = z.object({
    projectId: z.optional(ApId),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(MAX_AGENT_PAGE_SIZE).optional(),
})

const agentUtils = {
    isPublishable: (config: AgentConfig): boolean => (config.instructions ?? '').trim().length > 0,
}

export {
    Agent,
    agentUtils,
    AgentConfig,
    AgentIcon,
    AgentVisibility,
    AgentTemplate,
    CreateAgentRequest,
    DEFAULT_AGENT_MAX_STEPS,
    DraftAgentRequest,
    DraftAgentResponse,
    ListAgentsRequest,
    MAX_AGENT_OUTPUT_FIELDS,
    MAX_AGENT_PAGE_SIZE,
    MAX_AGENT_SHARED_MEMBERS,
    MAX_AGENT_STEP_BUDGET,
    MAX_AGENT_TEXT_LENGTH,
    MAX_AGENT_TOOLS,
    UpdateAgentRequest,
}

export type Agent = z.infer<typeof Agent>
export type AgentConfig = z.infer<typeof AgentConfig>
export type AgentTemplate = z.infer<typeof AgentTemplate>
export type CreateAgentRequest = z.infer<typeof CreateAgentRequest>
export type DraftAgentRequest = z.infer<typeof DraftAgentRequest>
export type DraftAgentResponse = z.infer<typeof DraftAgentResponse>
export type ListAgentsRequest = z.infer<typeof ListAgentsRequest>
export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequest>
