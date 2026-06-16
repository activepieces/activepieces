import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { tryCatchSync } from '@activepieces/shared'
import { repoRoot } from './repo-root'

const PROMPTS_DIR = path.join(repoRoot, 'packages/server/api/src/assets/prompts')
const GUIDE_TOPICS = ['build_flow', 'one_time_task', 'error_handling', 'http_fallback']

const EVAL_FRONTEND_URL = 'https://eval.activepieces.test'
const EVAL_PROJECT_LIST = '- Eval Project (id: eval-project)'
const EVAL_PROJECT_CONTEXT = 'No project is currently selected.'

type AssetReader = (absolutePath: string) => string

const workingTreeReader: AssetReader = (absolutePath) => readFileSync(absolutePath, 'utf-8')
const headReader: AssetReader = (absolutePath) =>
    execFileSync('git', ['show', `HEAD:${path.relative(repoRoot, absolutePath)}`], { cwd: repoRoot, encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 })

function loadSystemPrompt(read: AssetReader = workingTreeReader): string {
    return read(path.join(PROMPTS_DIR, 'chat-system-prompt.md'))
        .replaceAll('{{PROJECT_LIST}}', EVAL_PROJECT_LIST)
        .replaceAll('{{PROJECT_CONTEXT}}', EVAL_PROJECT_CONTEXT)
        .replaceAll('{{FRONTEND_URL}}', EVAL_FRONTEND_URL)
}

function loadGuides(read: AssetReader = workingTreeReader): Record<string, string> {
    return Object.fromEntries(GUIDE_TOPICS.map((topic) => [topic, read(path.join(PROMPTS_DIR, 'guides', `${topic}.md`))]))
}

function variant(label: string, read: AssetReader): PromptVariant {
    return { label, systemPrompt: loadSystemPrompt(read), guides: loadGuides(read) }
}

// baseline = the prompt at git HEAD; candidate = your working-tree edits (or an explicit file)
function resolveSources({ candidatePath }: { candidatePath?: string }): PromptSources {
    const baseline = tryCatchSync(() => variant('baseline (HEAD)', headReader)).data
        ?? variant('baseline (working tree — no HEAD)', workingTreeReader)
    const candidate = candidatePath
        ? variant(`candidate (${path.basename(candidatePath)})`, () => readFileSync(candidatePath, 'utf-8'))
        : variant('candidate (working tree)', workingTreeReader)
    const changed = baseline.systemPrompt !== candidate.systemPrompt
        || JSON.stringify(baseline.guides) !== JSON.stringify(candidate.guides)
    return { baseline, candidate, changed }
}

export const evalPrompts = {
    loadSystemPrompt,
    loadGuides,
    resolveSources,
}

export type PromptVariant = {
    label: string
    systemPrompt: string
    guides: Record<string, string>
}

export type PromptSources = {
    baseline: PromptVariant
    candidate: PromptVariant
    changed: boolean
}
