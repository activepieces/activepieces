import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DiscoveryBrief, isNil, Project, ProjectType } from '@activepieces/shared'

function loadPromptTemplate(filename: string): string {
    return readFileSync(path.resolve(`packages/server/api/src/assets/prompts/${filename}`), 'utf8')
}

const GUIDE_TOPICS = ['build_flow', 'one_time_task', 'error_handling', 'http_fallback'] as const

const PROMPT_TEMPLATES = {
    system: loadPromptTemplate('chat-system-prompt.md'),
    projectSelected: loadPromptTemplate('chat-project-context-selected.md'),
    noProject: loadPromptTemplate('chat-project-context-none.md'),
}

const GUIDES: Record<string, string> = Object.fromEntries(
    GUIDE_TOPICS.map((topic) => [topic, loadPromptTemplate(`guides/${topic}.md`)]),
)

function sanitizeProjectName(name: string): string {
    return name.replace(/[^a-zA-Z0-9 \-_.]/g, '').slice(0, 64)
}

function projectDisplayName(project: Project): string {
    return project.type === ProjectType.PERSONAL ? 'Personal Project' : project.displayName
}

function buildProjectListBlock({ projects, frontendUrl }: {
    projects: Project[]
    frontendUrl: string
}): string {
    if (projects.length === 0) return 'No projects available.'
    return projects.map((p) => {
        const url = `${frontendUrl}/projects/${p.id}`
        return `- **${sanitizeProjectName(projectDisplayName(p))}** (ID: ${p.id}) — [Open](${url})`
    }).join('\n')
}

function buildProjectContextBlock({ project, frontendUrl }: {
    project: Project | null
    frontendUrl: string
}): string {
    if (!project) {
        return PROMPT_TEMPLATES.noProject
    }
    return PROMPT_TEMPLATES.projectSelected
        .replaceAll('{{PROJECT_NAME}}', sanitizeProjectName(projectDisplayName(project)))
        .replaceAll('{{PROJECT_ID}}', project.id)
        .replaceAll('{{FRONTEND_URL}}', frontendUrl)
}

const EMPTY_BRIEF_TEXT = 'No discovery brief yet — build your understanding of the goal first.'

function buildBriefBlock(brief: DiscoveryBrief | null): string {
    if (isNil(brief)) return EMPTY_BRIEF_TEXT
    const lines: string[] = []
    if (brief.what) lines.push(`- what: ${brief.what}`)
    if (brief.why) lines.push(`- why: ${brief.why}`)
    if (brief.constraints?.length) lines.push(`- constraints: ${brief.constraints.join('; ')}`)
    if (brief.dataFindings?.length) lines.push(`- data findings: ${brief.dataFindings.join('; ')}`)
    if (brief.openQuestions?.length) lines.push(`- open questions: ${brief.openQuestions.join('; ')}`)
    return lines.length > 0 ? lines.join('\n') : EMPTY_BRIEF_TEXT
}

const EMPTY_MEMORY_TEXT = 'Nothing remembered about this user yet.'

function buildMemoryBlock(memories: string[]): string {
    if (memories.length === 0) return EMPTY_MEMORY_TEXT
    return memories.map((m) => `- ${m}`).join('\n')
}

function buildAgentSystemPrompt({ projects, currentProjectId, frontendUrl, discoveryBrief, userMemories }: {
    projects: Project[]
    currentProjectId: string | null
    frontendUrl: string
    discoveryBrief?: DiscoveryBrief | null
    userMemories?: string[]
}): string {
    const currentProject = currentProjectId
        ? projects.find((p) => p.id === currentProjectId) ?? null
        : null

    return PROMPT_TEMPLATES.system
        .replace('{{PROJECT_LIST}}', buildProjectListBlock({ projects, frontendUrl }))
        .replace('{{PROJECT_CONTEXT}}', buildProjectContextBlock({ project: currentProject, frontendUrl }))
        .replace('{{DISCOVERY_BRIEF}}', buildBriefBlock(discoveryBrief ?? null))
        .replace('{{USER_MEMORY}}', buildMemoryBlock(userMemories ?? []))
        .replaceAll('{{FRONTEND_URL}}', frontendUrl)
}

function loadGuides(): Record<string, string> {
    return GUIDES
}

export const chatPrompt = {
    buildSystemPrompt: buildAgentSystemPrompt,
    loadGuides,
    projectDisplayName,
}
