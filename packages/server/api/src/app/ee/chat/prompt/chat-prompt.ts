import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Project, ProjectType } from '@activepieces/shared'

function loadPromptTemplate(filename: string): string {
    return readFileSync(path.resolve(`packages/server/api/src/assets/prompts/${filename}`), 'utf8')
}

const PROMPT_TEMPLATES = {
    system: loadPromptTemplate('chat-system-prompt.md'),
    projectSelected: loadPromptTemplate('chat-project-context-selected.md'),
    noProject: loadPromptTemplate('chat-project-context-none.md'),
}

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

function buildAgentSystemPrompt({ projects, currentProjectId, frontendUrl }: {
    projects: Project[]
    currentProjectId: string | null
    frontendUrl: string
}): string {
    const currentProject = currentProjectId
        ? projects.find((p) => p.id === currentProjectId) ?? null
        : null

    return PROMPT_TEMPLATES.system
        .replace('{{PROJECT_LIST}}', buildProjectListBlock({ projects, frontendUrl }))
        .replace('{{PROJECT_CONTEXT}}', buildProjectContextBlock({ project: currentProject, frontendUrl }))
        .replaceAll('{{FRONTEND_URL}}', frontendUrl)
}

export const chatPrompt = {
    buildSystemPrompt: buildAgentSystemPrompt,
    projectDisplayName,
}
