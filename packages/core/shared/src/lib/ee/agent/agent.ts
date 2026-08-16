import { AgentOutputField, AgentTool } from '@activepieces/core-execution'
import { AIProviderName, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'
import { ColorName } from '../../management/project/project'

// 50 KiB, the ceiling every other single blob of agent text already uses — a chat message
// (SendAgentMessageRequest), an eval prompt (SimulateAgentRequest) and a flow step's instruction.
// One number so the editor can never reject text the flow-step path accepts.
const MAX_AGENT_TEXT_LENGTH = 51_200

// A run walks the tool list once per step, so both bound how much work one turn can schedule.
const MAX_AGENT_TOOLS = 100
const MAX_AGENT_OUTPUT_FIELDS = 50

// Hard stop on an agent that never decides it is finished. Every step spends credits.
const MAX_AGENT_STEP_BUDGET = 1_000

// Applied when an agent is created and then stored on the row, so changing this never
// alters an existing agent — only the next one someone makes.
const DEFAULT_AGENT_MAX_STEPS = 20

enum AgentIcon {
    BOT = 'BOT',
    SPARKLES = 'SPARKLES',
    MESSAGE = 'MESSAGE',
    USERS = 'USERS',
    BOOK = 'BOOK',
    CHART = 'CHART',
    CALENDAR = 'CALENDAR',
    MAIL = 'MAIL',
    GLOBE = 'GLOBE',
    FILE = 'FILE',
    SEARCH = 'SEARCH',
    ZAP = 'ZAP',
}

const AgentConfig = z.object({
    instructions: z.string().max(MAX_AGENT_TEXT_LENGTH),
    provider: Nullable(z.enum(AIProviderName)),
    modelName: Nullable(z.string()),
    maxSteps: z.number().int().positive().max(MAX_AGENT_STEP_BUDGET),
    tools: z.array(AgentTool).max(MAX_AGENT_TOOLS),
    structuredOutput: z.array(AgentOutputField).max(MAX_AGENT_OUTPUT_FIELDS),
})

const AgentConfigInput = AgentConfig.partial()

const Agent = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: z.string(),
    externalId: z.string(),
    displayName: z.string(),
    description: Nullable(z.string()),
    icon: z.enum(AgentIcon),
    color: z.enum(ColorName),
    draft: AgentConfig,
    published: Nullable(AgentConfig),
    publishedAt: Nullable(z.string()),
})

const CreateAgentRequest = z.object({
    projectId: z.string(),
    displayName: z.string().min(1, formErrors.required),
    description: z.optional(Nullable(z.string())),
    icon: z.optional(z.enum(AgentIcon)),
    color: z.optional(z.enum(ColorName)),
    externalId: z.optional(z.string()),
    draft: z.optional(AgentConfigInput),
})

const UpdateAgentRequest = z.object({
    displayName: z.optional(z.string().min(1, formErrors.required)),
    description: z.optional(Nullable(z.string())),
    icon: z.optional(z.enum(AgentIcon)),
    color: z.optional(z.enum(ColorName)),
    draft: z.optional(AgentConfigInput),
})

const ListAgentsRequest = z.object({
    cursor: z.optional(z.string()),
    limit: z.optional(z.coerce.number().int().positive()),
    search: z.optional(z.string()),
})

const DraftAgentRequest = z.object({
    prompt: z.string().min(1, formErrors.required).max(MAX_AGENT_TEXT_LENGTH),
})

const AgentTemplate = z.object({
    templateKey: z.string(),
    displayName: z.string(),
    description: z.string(),
    icon: z.enum(AgentIcon),
    color: z.enum(ColorName),
    instructions: z.string(),
})

export {
    Agent,
    AgentConfig,
    AgentConfigInput,
    AgentIcon,
    AgentTemplate,
    CreateAgentRequest,
    DEFAULT_AGENT_MAX_STEPS,
    DraftAgentRequest,
    ListAgentsRequest,
    MAX_AGENT_OUTPUT_FIELDS,
    MAX_AGENT_STEP_BUDGET,
    MAX_AGENT_TEXT_LENGTH,
    MAX_AGENT_TOOLS,
    UpdateAgentRequest,
}

export type Agent = z.infer<typeof Agent>
export type AgentConfig = z.infer<typeof AgentConfig>
export type AgentConfigInput = z.infer<typeof AgentConfigInput>
export type AgentTemplate = z.infer<typeof AgentTemplate>
export type CreateAgentRequest = z.infer<typeof CreateAgentRequest>
export type DraftAgentRequest = z.infer<typeof DraftAgentRequest>
export type ListAgentsRequest = z.infer<typeof ListAgentsRequest>
export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequest>
