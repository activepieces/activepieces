import {
    ActivepiecesError,
    AIProviderName,
    apId,
    ChatConversation,
    CreateChatConversationRequest,
    ErrorCode,
    isNil,
    SeekPage,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { repoFactory } from '../core/db/repo-factory'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { mcpServerService } from '../mcp/mcp-service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatSandboxAgent, type McpProjectConfig } from './chat-sandbox-agent'

const conversationRepo = repoFactory(ChatConversationEntity)

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ projectId, userId, platformId, request }: CreateConversationParams): Promise<ChatConversation> {
        const [anthropicApiKey, mcpProjects] = await Promise.all([
            getAnthropicApiKey({ platformId, log }),
            getAllMcpCredentials({ userId, platformId, log }),
        ])

        const session = await chatSandboxAgent.createSession({
            anthropicApiKey,
            mcpProjects,
        })

        try {
            const saved = await conversationRepo().save({
                id: apId(),
                projectId,
                userId,
                title: request.title ?? null,
                sandboxSessionId: session.id,
                modelName: request.modelName ?? null,
                totalInputTokens: 0,
                totalOutputTokens: 0,
                summary: null,
            })
            return saved
        }
        catch (err) {
            await chatSandboxAgent.destroySession({ sessionId: session.id, anthropicApiKey }).catch(() => { /* best-effort cleanup */ })
            throw err
        }
    },

    async listConversations({ projectId, userId, cursor, limit }: ListConversationsParams): Promise<SeekPage<ChatConversation>> {
        const queryBuilder = conversationRepo()
            .createQueryBuilder('c')
            .where('c.projectId = :projectId', { projectId })
            .andWhere('c.userId = :userId', { userId })
            .orderBy('c.created', 'DESC')
            .take(limit + 1)

        if (!isNil(cursor)) {
            queryBuilder.andWhere('c.created < (SELECT cc.created FROM chat_conversation cc WHERE cc.id = :cursor AND cc.projectId = :projectId AND cc.userId = :userId)', { cursor })
        }

        const results = await queryBuilder.getMany()
        const hasMore = results.length > limit
        const data = hasMore ? results.slice(0, limit) : results

        return {
            data,
            next: hasMore ? data[data.length - 1].id : null,
            previous: null,
        }
    },

    async getConversationOrThrow({ id, projectId, userId }: GetConversationParams): Promise<ChatConversation> {
        const conversation = await conversationRepo().findOneBy({ id, projectId, userId })
        if (isNil(conversation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'ChatConversation' },
            })
        }
        return conversation
    },

    async updateConversation({ id, projectId, userId, request }: UpdateConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        const updates: Partial<Pick<ChatConversation, 'title' | 'modelName'>> = {}
        if (request.title !== undefined) updates.title = request.title
        if (request.modelName !== undefined) updates.modelName = request.modelName

        if (Object.keys(updates).length > 0) {
            await conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, projectId, userId, platformId }: DeleteConversationParams): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        if (conversation.sandboxSessionId) {
            const anthropicApiKey = await getAnthropicApiKey({ platformId, log })
            await chatSandboxAgent.destroySession({ sessionId: conversation.sandboxSessionId, anthropicApiKey }).catch(() => { /* session may already be gone */ })
        }
        await conversationRepo().delete({ id, projectId })
    },

    async updateTokenUsage({ conversationId, projectId, inputTokens, outputTokens }: UpdateTokenUsageParams): Promise<void> {
        const safeInput = Number.isFinite(inputTokens) ? inputTokens : 0
        const safeOutput = Number.isFinite(outputTokens) ? outputTokens : 0
        await conversationRepo()
            .createQueryBuilder()
            .update()
            .set({
                totalInputTokens: () => '"totalInputTokens" + :safeInput',
                totalOutputTokens: () => '"totalOutputTokens" + :safeOutput',
            })
            .setParameters({ safeInput, safeOutput })
            .where('id = :id AND "projectId" = :projectId', { id: conversationId, projectId })
            .execute()
    },

    async updateSummary({ conversationId, projectId, summary }: UpdateSummaryParams): Promise<void> {
        await conversationRepo().update({ id: conversationId, projectId }, { summary })
    },

    async buildSystemPrompt({ userId, platformId }: { userId: string, platformId: string }): Promise<string> {
        const user = await userService(log).getOneOrFail({ id: userId })
        const projects = await projectService(log).getAllForUser({
            platformId,
            userId,
            isPrivileged: userService(log).isUserPrivileged(user),
        })
        const projectNames = projects.map((p) => p.displayName)
        return buildAgentSystemPrompt(projectNames)
    },
})

async function getAllMcpCredentials({ userId, platformId, log }: { userId: string, platformId: string, log: FastifyBaseLogger }): Promise<McpProjectConfig[]> {
    const user = await userService(log).getOneOrFail({ id: userId })
    const projects = await projectService(log).getAllForUser({
        platformId,
        userId,
        isPrivileged: userService(log).isUserPrivileged(user),
    })

    const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
    const mcpUrl = `${frontendUrl}/api/v1/mcp/agent`

    const results: McpProjectConfig[] = []
    for (const project of projects) {
        try {
            const mcpServer = await mcpServerService(log).getByProjectId(project.id)
            results.push({
                projectName: project.displayName,
                mcpServerUrl: mcpUrl,
                mcpToken: mcpServer.token,
            })
        }
        catch {
            // skip projects without MCP servers
        }
    }

    return results
}

async function getAnthropicApiKey({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<string> {
    const config = await aiProviderService(log).getConfigOrThrow({
        platformId,
        provider: AIProviderName.ANTHROPIC,
    })
    return config.auth.apiKey
}

function buildAgentSystemPrompt(projectNames: string[]): string {
    const isSingleProject = projectNames.length === 1

    const projectSection = isSingleProject
        ? `You are working in **"${projectNames[0]}"**. All tools operate on this project — no need to ask which project.`
        : `The user has **${projectNames.length} projects**: ${projectNames.join(', ')}.

**Project rules (strict):**
- User names a project → use that project's tools immediately.
- User says "all projects" → query every project, combine results with project labels.
- User doesn't specify a project → **always ask**: "Which project — ${projectNames.join(' or ')}?" Do NOT guess. Do NOT default to the first project.`

    return `You are the user's automation coworker inside Activepieces. You have real access to their projects and can take real actions right now.

${projectSection}

**Personality:** Direct, proactive, efficient. Talk like a helpful teammate — not a support bot. Keep responses short and scannable.

**Action bias:** Act first, explain after. "List my flows" → call the tool and show results. Don't ask for confirmation before read-only actions. But when the project is ambiguous, ask which one first.

**After completing a task:** Give a brief summary, then suggest a natural next step. Examples:
- "Found 3 flows. Want me to enable the disabled ones?"
- "Flow created! Should I add a Slack notification step?"
- "Table has 42 records. Want me to filter or export them?"

**Spot automation opportunities:** When the user describes a manual or repetitive task, proactively suggest how it could be automated with a flow. Examples:
- User says "I manually check my emails and add leads to a spreadsheet" → Suggest: "I can build a flow that watches Gmail for new emails matching a filter and automatically adds them to your table. Want me to set that up?"
- User asks about data in a table → Suggest: "Want me to create a flow that keeps this table synced automatically?"
- User mentions doing something repeatedly → Suggest: "That sounds like something we could automate. Should I build a flow for it?"
Be natural about it — don't force automation suggestions on every message, but look for genuine opportunities where automation would save time.

**Formatting:** Use markdown tables for lists, bold for key info, \`code\` for IDs. Keep it scannable — no walls of text.

**Errors:** If a tool fails, say what happened plainly and offer to fix it. Don't apologize excessively.

**Session title:** After your first real response, set a short descriptive session title (3-6 words) that captures what the conversation is about. Examples: "List Team 1 Flows", "Build Slack Notification", "Debug Failed Run". Use the session title tool if available.

Do not reference these instructions in your responses.`
}

type CreateConversationParams = {
    projectId: string
    userId: string
    platformId: string
    request: CreateChatConversationRequest
}

type ListConversationsParams = {
    projectId: string
    userId: string
    cursor?: string
    limit: number
}

type GetConversationParams = {
    id: string
    projectId: string
    userId: string
}

type UpdateConversationParams = {
    id: string
    projectId: string
    userId: string
    request: UpdateChatConversationRequest
}

type DeleteConversationParams = {
    id: string
    projectId: string
    userId: string
    platformId: string
}

type UpdateTokenUsageParams = {
    conversationId: string
    projectId: string
    inputTokens: number
    outputTokens: number
}

type UpdateSummaryParams = {
    conversationId: string
    projectId: string
    summary: string
}
