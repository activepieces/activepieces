import { readFileSync } from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(__dirname, '../../../../../..')
const PROMPTS_DIR = path.join(REPO_ROOT, 'packages/server/api/src/assets/prompts')
const GUIDE_TOPICS = ['build_flow', 'one_time_task', 'error_handling', 'http_fallback']

const EVAL_FRONTEND_URL = 'https://eval.activepieces.test'
const EVAL_PROJECT_LIST = '- Eval Project (id: eval-project)'
const EVAL_PROJECT_CONTEXT = 'No project is currently selected.'

function loadSystemPrompt(): string {
    const template = readFileSync(path.join(PROMPTS_DIR, 'chat-system-prompt.md'), 'utf-8')
    return template
        .replaceAll('{{PROJECT_LIST}}', EVAL_PROJECT_LIST)
        .replaceAll('{{PROJECT_CONTEXT}}', EVAL_PROJECT_CONTEXT)
        .replaceAll('{{FRONTEND_URL}}', EVAL_FRONTEND_URL)
}

function loadGuides(): Record<string, string> {
    return Object.fromEntries(
        GUIDE_TOPICS.map((topic) => [topic, readFileSync(path.join(PROMPTS_DIR, 'guides', `${topic}.md`), 'utf-8')]),
    )
}

export const evalPromptLoader = {
    loadSystemPrompt,
    loadGuides,
}
