import { AgentOutputField, AgentTool } from '@activepieces/core-execution'
import { AIProviderName, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'

const MAX_INSTRUCTIONS_LENGTH = 20_000
const MAX_DISPLAY_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 500
const MAX_DRAFT_PROMPT_LENGTH = 2_000
const MAX_KEY_LENGTH = 60
const MAX_STEP_BUDGET = 1_000
const MAX_TOOLS = 100
const MAX_OUTPUT_FIELDS = 50
const MAX_PAGE_SIZE = 100

const DEFAULT_AGENT_MAX_STEPS = 20
const DEFAULT_AGENT_ICON_KEY = 'bot'
const DEFAULT_AGENT_COLOR_KEY = 'purple'

const AgentConfig = z.object({
    instructions: z.string().max(MAX_INSTRUCTIONS_LENGTH),
    provider: Nullable(z.enum(AIProviderName)),
    modelName: Nullable(z.string()),
    maxSteps: z.number().int().positive().max(MAX_STEP_BUDGET),
    tools: z.array(AgentTool).max(MAX_TOOLS),
    structuredOutput: z.array(AgentOutputField).max(MAX_OUTPUT_FIELDS),
})

const AgentConfigInput = AgentConfig.partial()

const Agent = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: z.string(),
    externalId: z.string(),
    displayName: z.string(),
    description: Nullable(z.string()),
    iconKey: z.string(),
    colorKey: z.string(),
    draft: AgentConfig,
    published: Nullable(AgentConfig),
    publishedAt: Nullable(z.string()),
})

const CreateAgentRequest = z.object({
    displayName: z.string().min(1, formErrors.required).max(MAX_DISPLAY_NAME_LENGTH),
    description: z.optional(Nullable(z.string().max(MAX_DESCRIPTION_LENGTH))),
    iconKey: z.optional(z.string().max(MAX_KEY_LENGTH)),
    colorKey: z.optional(z.string().max(MAX_KEY_LENGTH)),
    externalId: z.optional(z.string().max(MAX_KEY_LENGTH)),
    draft: z.optional(AgentConfigInput),
})

const UpdateAgentRequest = z.object({
    displayName: z.optional(z.string().min(1, formErrors.required).max(MAX_DISPLAY_NAME_LENGTH)),
    description: z.optional(Nullable(z.string().max(MAX_DESCRIPTION_LENGTH))),
    iconKey: z.optional(z.string().max(MAX_KEY_LENGTH)),
    colorKey: z.optional(z.string().max(MAX_KEY_LENGTH)),
    draft: z.optional(AgentConfigInput),
})

const ListAgentsRequest = z.object({
    cursor: z.optional(z.string()),
    limit: z.optional(z.coerce.number().int().positive().max(MAX_PAGE_SIZE)),
    search: z.optional(z.string().max(MAX_DISPLAY_NAME_LENGTH)),
})

const DraftAgentRequest = z.object({
    prompt: z.string().min(1, formErrors.required).max(MAX_DRAFT_PROMPT_LENGTH),
})

const AgentTemplate = z.object({
    templateKey: z.string(),
    displayName: z.string(),
    description: z.string(),
    iconKey: z.string(),
    colorKey: z.string(),
    instructions: z.string(),
})

export {
    Agent,
    AgentConfig,
    AgentConfigInput,
    AgentTemplate,
    CreateAgentRequest,
    DEFAULT_AGENT_COLOR_KEY,
    DEFAULT_AGENT_ICON_KEY,
    DEFAULT_AGENT_MAX_STEPS,
    DraftAgentRequest,
    ListAgentsRequest,
    MAX_DESCRIPTION_LENGTH,
    MAX_DISPLAY_NAME_LENGTH,
    MAX_DRAFT_PROMPT_LENGTH,
    MAX_INSTRUCTIONS_LENGTH,
    MAX_KEY_LENGTH,
    MAX_OUTPUT_FIELDS,
    MAX_PAGE_SIZE,
    MAX_STEP_BUDGET,
    MAX_TOOLS,
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
