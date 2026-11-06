import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { AGENT_SKILLS, agentToolSkills } from '@activepieces/shared'

function loadSystemPrompt(): string {
    return readFileSync(path.join(promptsDir(), 'chat-system-prompt.md'), 'utf-8')
        .replaceAll('{{PROJECT_LIST}}', `- ${EVAL_PROJECT.displayName} (id: ${EVAL_PROJECT.id})`)
        .replaceAll('{{PROJECT_CONTEXT}}', projectContext())
        .replaceAll('{{FRONTEND_URL}}', EVAL_FRONTEND_URL)
        + agentToolSkills.renderSkillsNote({ surface: 'CHAT' })
}

function loadGuides(): Record<string, string> {
    const topics = AGENT_SKILLS.flatMap((skill) => skill.guideTopic === undefined ? [] : [skill.guideTopic])
    return Object.fromEntries(topics.map((topic) => [topic, readFileSync(path.join(promptsDir(), 'guides', `${topic}.md`), 'utf-8')]))
}

function projectContext(): string {
    return readFileSync(path.join(promptsDir(), 'chat-project-context-selected.md'), 'utf-8')
        .replaceAll('{{PROJECT_NAME}}', EVAL_PROJECT.displayName)
        .replaceAll('{{PROJECT_ID}}', EVAL_PROJECT.id)
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
    return path.join(repoRoot(), 'packages/server/api/src/assets/prompts')
}

function repoRoot(): string {
    const found = [...Array(MAX_DEPTH).keys()]
        .map((depth) => path.resolve(__dirname, ...Array<string>(depth).fill('..')))
        .find((dir) => existsSync(path.join(dir, '.git')))
    if (found === undefined) {
        throw new Error('evals: could not find the repo root above this file')
    }
    return found
}

const MAX_DEPTH = 12
const EVAL_FRONTEND_URL = 'https://eval.activepieces.test'
const systemPrompt = once(loadSystemPrompt)
const guides = once(loadGuides)

export const evalPrompts = {
    systemPrompt,
    guides,
}

export const EVAL_PROJECT = { id: 'eval-project', displayName: 'Eval Project', type: 'TEAM' }
