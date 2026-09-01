import { AgentOutputField, AgentTool } from '@activepieces/core-execution'
import { AIProviderName, ApId, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'
import { ColorName } from '../../management/project/project'

const MAX_AGENT_TEXT_LENGTH = 51_200
const MAX_SUGGESTED_AGENT_TOOLS = 4
const MAX_AGENT_TOOLS = 100
const MAX_AGENT_OUTPUT_FIELDS = 50
const MAX_AGENT_STEP_BUDGET = 1_000
const MAX_AGENT_SHARED_MEMBERS = 200
const MAX_AGENT_PAGE_SIZE = 100
const MAX_AGENT_SEARCH_LENGTH = 200
const MAX_AGENT_NAME_LENGTH = 200
const MAX_AGENT_DESCRIPTION_LENGTH = 2_000
const MAX_AGENT_CONFIG_BYTES = 128_000
const MAX_DRAFT_PROMPT_LENGTH = 2_000
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
    providerConfigId: Nullable(ApId),
    modelName: Nullable(z.string().max(MAX_AGENT_NAME_LENGTH)),
    maxSteps: z.number().int().positive().max(MAX_AGENT_STEP_BUDGET).default(DEFAULT_AGENT_MAX_STEPS),
    tools: z.array(AgentTool).max(MAX_AGENT_TOOLS).default([]),
    structuredOutput: z.array(AgentOutputField).max(MAX_AGENT_OUTPUT_FIELDS).default([]),
}).superRefine((config, ctx) => {
    if (JSON.stringify(config).length > MAX_AGENT_CONFIG_BYTES) {
        ctx.addIssue({ code: 'custom', message: formErrors.agentConfigTooLarge })
    }
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

const AgentUsage = z.object({
    total: z.number().int().nonnegative(),
    names: z.array(z.string()),
})

const AgentWithUsage = Agent.extend({
    publishedFlowsUsingAgent: AgentUsage.optional(),
})

const AgentSummary = Agent.omit({ draft: true, published: true }).extend({
    isPublished: z.boolean(),
    toolCount: z.number(),
    toolPieceNames: z.array(z.string()),
    projectDisplayName: z.string(),
    projectIsPrivate: z.boolean(),
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

const UpdateAgentRequest = CreateAgentRequest.omit({ projectId: true }).partial().extend({
    goLive: z.boolean().optional(),
})

const AgentDraftFields = z.object({
    displayName: z.string().min(1, formErrors.required).max(MAX_AGENT_NAME_LENGTH),
    description: z.string().max(MAX_AGENT_NAME_LENGTH),
    icon: z.enum(AgentIcon).catch(AgentIcon.BOT),
    color: z.enum(ColorName).catch(ColorName.PURPLE),
    instructions: z.string().min(1, formErrors.required).max(MAX_AGENT_TEXT_LENGTH),
})

const DraftAgentResponse = AgentDraftFields.extend({
    tools: z.array(AgentTool).max(MAX_SUGGESTED_AGENT_TOOLS),
    provider: Nullable(z.enum(AIProviderName)),
    modelName: Nullable(z.string().max(MAX_AGENT_NAME_LENGTH)),
})


const DraftAgentRequest = z.object({
    projectId: ApId,
    prompt: z.string().min(1, formErrors.required).max(MAX_DRAFT_PROMPT_LENGTH),
})

const GetAgentRequest = z.object({
    includeUsage: z.coerce.boolean().optional(),
})

enum AgentListSort {
    UPDATED = 'updated',
    CREATED = 'created',
    NAME = 'name',
}

const ListAgentsRequest = z.object({
    projectId: z.optional(ApId),
    search: z.optional(z.string().max(MAX_AGENT_SEARCH_LENGTH)),
    sort: z.optional(z.enum(AgentListSort)),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(MAX_AGENT_PAGE_SIZE).optional(),
})

const agentUtils = {
    isPublishable: (config: AgentConfig): boolean => (config.instructions ?? '').trim().length > 0,
}

export {
    AgentListSort,
    MAX_AGENT_SEARCH_LENGTH,
    Agent,
    AgentUsage,
    AgentWithUsage,
    GetAgentRequest,
    AgentSummary,
    agentUtils,
    AgentConfig,
    AgentIcon,
    AgentVisibility,
    CreateAgentRequest,
    DEFAULT_AGENT_MAX_STEPS,
    DraftAgentRequest,
    AgentDraftFields,
    DraftAgentResponse,
    ListAgentsRequest,
    MAX_AGENT_OUTPUT_FIELDS,
    MAX_AGENT_CONFIG_BYTES,
    MAX_AGENT_DESCRIPTION_LENGTH,
    MAX_AGENT_NAME_LENGTH,
    MAX_AGENT_PAGE_SIZE,
    MAX_DRAFT_PROMPT_LENGTH,
    MAX_AGENT_SHARED_MEMBERS,
    MAX_AGENT_STEP_BUDGET,
    MAX_AGENT_TEXT_LENGTH,
    MAX_AGENT_TOOLS,
    MAX_SUGGESTED_AGENT_TOOLS,
    UpdateAgentRequest,
}

export type Agent = z.infer<typeof Agent>
export type AgentSummary = z.infer<typeof AgentSummary>
export type AgentUsage = z.infer<typeof AgentUsage>
export type AgentWithUsage = z.infer<typeof AgentWithUsage>
export type GetAgentRequest = z.infer<typeof GetAgentRequest>
export type AgentConfig = z.infer<typeof AgentConfig>
export type CreateAgentRequest = z.infer<typeof CreateAgentRequest>
export type DraftAgentRequest = z.infer<typeof DraftAgentRequest>
export type AgentDraftFields = z.infer<typeof AgentDraftFields>
export type DraftAgentResponse = z.infer<typeof DraftAgentResponse>
export type ListAgentsRequest = z.infer<typeof ListAgentsRequest>
export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequest>
