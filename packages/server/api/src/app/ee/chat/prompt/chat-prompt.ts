import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Project, ProjectType, REFERRAL_CAP_USD, REFERRAL_GRANT_USD } from '@activepieces/shared'

function loadPromptTemplate(filename: string): string {
    return readFileSync(path.resolve(`packages/server/api/src/assets/prompts/${filename}`), 'utf8')
}

const GUIDE_TOPICS = ['build_flow', 'one_time_task', 'error_handling', 'http_fallback', 'control_flow', 'state', 'tables', 'ai', 'about_activepieces'] as const

const PROMPT_TEMPLATES = {
    system: loadPromptTemplate('chat-system-prompt.md'),
    projectSelected: loadPromptTemplate('chat-project-context-selected.md'),
    noProject: loadPromptTemplate('chat-project-context-none.md'),
    referralSystem: loadPromptTemplate('referral-system-prompt.md'),
}

const GUIDES: Record<string, string> = Object.fromEntries(
    GUIDE_TOPICS.map((topic) => [topic, loadPromptTemplate(`guides/${topic}.md`)]),
)

function sanitizeProjectName(name: string): string {
    return name.replace(/[^a-zA-Z0-9 \-_.]/g, '').slice(0, 64)
}

function sanitizeFirstName(firstName: string | null): string {
    const cleaned = (firstName ?? '').replace(/[^a-zA-Z0-9 \-_.]/g, '').trim().slice(0, 40)
    return cleaned.length > 0 ? cleaned : 'there'
}

function buildReferralSystemPrompt({ firstName }: { firstName: string | null }): string {
    return PROMPT_TEMPLATES.referralSystem
        .replaceAll('{{FIRST_NAME}}', sanitizeFirstName(firstName))
        .replaceAll('{{GRANT_USD}}', String(REFERRAL_GRANT_USD))
        .replaceAll('{{CAP_USD}}', String(REFERRAL_CAP_USD))
        .replaceAll('{{MAX_REFERRALS}}', String(Math.floor(REFERRAL_CAP_USD / REFERRAL_GRANT_USD)))
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

function buildProjectContextBlockFromTemplates({ project, frontendUrl, selectedTemplate, noProjectTemplate }: {
    project: Project | null
    frontendUrl: string
    selectedTemplate: string
    noProjectTemplate: string
}): string {
    if (!project) {
        return noProjectTemplate
    }
    return selectedTemplate
        .replaceAll('{{PROJECT_NAME}}', sanitizeProjectName(projectDisplayName(project)))
        .replaceAll('{{PROJECT_ID}}', project.id)
        .replaceAll('{{FRONTEND_URL}}', frontendUrl)
}

function buildAgentSystemPrompt({ projects, currentProjectId, frontendUrl, templates }: {
    projects: Project[]
    currentProjectId: string | null
    frontendUrl: string
    templates?: Partial<PromptTemplateSources>
}): string {
    const currentProject = currentProjectId
        ? projects.find((p) => p.id === currentProjectId) ?? null
        : null

    const systemTemplate = templates?.system ?? PROMPT_TEMPLATES.system
    const selectedTemplate = templates?.projectSelected ?? PROMPT_TEMPLATES.projectSelected
    const noProjectTemplate = templates?.noProject ?? PROMPT_TEMPLATES.noProject

    return systemTemplate
        .replace('{{PROJECT_LIST}}', buildProjectListBlock({ projects, frontendUrl }))
        .replace('{{PROJECT_CONTEXT}}', buildProjectContextBlockFromTemplates({ project: currentProject, frontendUrl, selectedTemplate, noProjectTemplate }))
        .replaceAll('{{FRONTEND_URL}}', frontendUrl)
}

export const chatPrompt = {
    buildSystemPrompt: buildAgentSystemPrompt,
    buildReferralSystemPrompt,
    guides: GUIDES,
    projectDisplayName,
    sources: {
        ...PROMPT_TEMPLATES,
        guides: GUIDES,
    },
}

export type PromptTemplateSources = {
    system: string
    projectSelected: string
    noProject: string
}
