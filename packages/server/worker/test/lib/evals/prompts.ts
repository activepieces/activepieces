import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { AGENT_SKILLS, agentToolSkills } from '@activepieces/shared'

function loadSystemPrompt(): string {
    return readFileSync(path.join(promptsDir(), 'chat-system-prompt.md'), 'utf-8')
        .replaceAll('{{PROJECT_LIST}}', EVAL_PROJECT_LIST)
        .replaceAll('{{PROJECT_CONTEXT}}', EVAL_PROJECT_CONTEXT)
        .replaceAll('{{FRONTEND_URL}}', EVAL_FRONTEND_URL)
        + agentToolSkills.renderSkillsNote({ surface: 'CHAT' })
}

function loadGuides(): Record<string, string> {
    const topics = AGENT_SKILLS.flatMap((skill) => skill.guideTopic === undefined ? [] : [skill.guideTopic])
    return Object.fromEntries(topics.map((topic) => [topic, readFileSync(path.join(promptsDir(), 'guides', `${topic}.md`), 'utf-8')]))
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
const EVAL_PROJECT_LIST = '- Eval Project (id: eval-project)'
const EVAL_PROJECT_CONTEXT = 'No project is currently selected.'

export const evalPrompts = {
    loadSystemPrompt,
    loadGuides,
}
