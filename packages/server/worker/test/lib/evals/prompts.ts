import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { AGENT_SKILLS, agentToolSkills } from '@activepieces/shared'

function loadSystemPrompt(): string {
    return readFileSync(path.join(promptsDir(), 'chat-system-prompt.md'), 'utf-8')
        .replaceAll('{{PROJECT_LIST}}', EVAL_PROJECT_LIST)
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
        .replaceAll('{{PROJECT_NAME}}', EVAL_PROJECT_NAME)
        .replaceAll('{{PROJECT_ID}}', EVAL_PROJECT_ID)
        .replaceAll('{{FRONTEND_URL}}', EVAL_FRONTEND_URL)
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
const EVAL_PROJECT_ID = 'eval-project'
const EVAL_PROJECT_NAME = 'Eval Project'
const EVAL_PROJECT_LIST = `- ${EVAL_PROJECT_NAME} (id: ${EVAL_PROJECT_ID})`

export const evalPrompts = {
    loadSystemPrompt,
    loadGuides,
}
