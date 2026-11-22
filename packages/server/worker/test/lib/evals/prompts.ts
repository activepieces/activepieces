import { readFileSync } from 'node:fs'
import path from 'node:path'
import { AGENT_SKILLS, agentToolSkills } from '@activepieces/shared'
import { repoPaths } from './repo-paths'

function systemPrompt({ project }: { project: PromptProject }): string {
    return readFileSync(path.join(promptsDir(), 'chat-system-prompt.md'), 'utf-8')
        .replaceAll('{{PROJECT_LIST}}', `- ${project.displayName} (id: ${project.id})`)
        .replaceAll('{{PROJECT_CONTEXT}}', projectContext({ project }))
        .replaceAll('{{FRONTEND_URL}}', EVAL_FRONTEND_URL)
        + agentToolSkills.renderSkillsNote({ surface: 'CHAT' })
}

function loadGuides(): Record<string, string> {
    const topics = AGENT_SKILLS.flatMap((skill) => skill.guideTopic === undefined ? [] : [skill.guideTopic])
    return Object.fromEntries(topics.map((topic) => [topic, readFileSync(path.join(promptsDir(), 'guides', `${topic}.md`), 'utf-8')]))
}

function projectContext({ project }: { project: PromptProject }): string {
    return readFileSync(path.join(promptsDir(), 'chat-project-context-selected.md'), 'utf-8')
        .replaceAll('{{PROJECT_NAME}}', project.displayName)
        .replaceAll('{{PROJECT_ID}}', project.id)
        .replaceAll('{{FRONTEND_URL}}', EVAL_FRONTEND_URL)
}

function once<T>(load: () => T): () => T {
    let cached: { value: T } | null = null
    return () => {
        cached = cached ?? { value: load() }
        return cached.value
    }
}

function promptsDir(): string {
    return path.join(repoPaths.root(), 'packages/server/api/src/assets/prompts')
}

const EVAL_FRONTEND_URL = 'https://eval.activepieces.test'
const guides = once(loadGuides)

export const evalPrompts = {
    systemPrompt,
    guides,
}

export const EVAL_PROJECT: PromptProject = { id: 'eval-project', displayName: 'Eval Project', type: 'TEAM' }

export type PromptProject = {
    id: string
    displayName: string
    type: string
}
