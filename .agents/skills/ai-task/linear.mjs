import { chmod, lstat, mkdir, readdir, readFile, realpath, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLAUDE_DIR = join(homedir(), '.claude')
const SETTINGS_PATH = join(CLAUDE_DIR, 'settings.json')
const COMMANDS = { setup, order }

const [command, ...args] = process.argv.slice(2)
if (!COMMANDS[command]) {
    fail('Usage: node linear.mjs setup | node linear.mjs order AI-41 AI-57 ...')
}
await COMMANDS[command](args)

async function setup() {
    await moveOldSkillCopies()
    if (!process.stdin.isTTY) {
        fail('Run this in your own terminal (not inside Claude Code), so the key stays hidden.')
    }
    console.log('1. Open https://linear.app/settings/account/security')
    console.log('2. New key, name it "Activepieces · <your name>\'s Claude (ai-task)", copy it')
    const key = (await askHidden('3. Paste it here (hidden) and press Enter: ')).trim()
    if (!key.startsWith('lin_api_')) {
        fail('That doesn\'t look like a Linear key. It should start with lin_api_.')
    }
    const { viewer } = await linear({ key, query: '{ viewer { name } }' })
    const settings = await readSettings()
    await mkdir(dirname(SETTINGS_PATH), { recursive: true })
    if (process.platform !== 'win32') {
        await chmod(SETTINGS_PATH, 0o600).catch(() => undefined)
    }
    await writeFile(SETTINGS_PATH, JSON.stringify({ ...settings, env: { ...settings.env, LINEAR_API_KEY: key } }, null, 2) + '\n', { mode: 0o600 })
    console.log(`\nSaved for ${viewer.name}. Restart Claude Code and you're set.`)
}

async function order(ids) {
    const key = process.env.LINEAR_API_KEY
    if (!key) {
        fail('No LINEAR_API_KEY. Run: node .agents/skills/ai-task/linear.mjs setup')
    }
    if (ids.length === 0) {
        fail('Give the ticket ids top first, e.g. order AI-41 AI-57')
    }
    const updates = ids.map((id, i) => `r${i}: issueUpdate(id: ${JSON.stringify(id)}, input: { sortOrder: ${(i + 1) * 1000} }) { success }`)
    await linear({ key, query: `mutation { ${updates.join(' ')} }` })
    console.log(`Ordered: ${ids.join(' > ')}`)
}

async function linear({ key, query }) {
    const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { Authorization: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    }).catch(() => fail('Couldn\'t reach Linear. Check your internet and try again.'))
    const body = await response.json().catch(() => ({}))
    if (!response.ok || !body.data || body.errors) {
        fail(`Linear said no: ${body.errors?.[0]?.message ?? response.status}`)
    }
    return body.data
}

function askHidden(prompt) {
    return new Promise((resolve) => {
        process.stdout.write(prompt)
        process.stdin.setRawMode(true)
        process.stdin.resume()
        process.stdin.setEncoding('utf8')
        let value = ''
        const onData = (chunk) => {
            for (const char of chunk) {
                if (char === '\u0003') {
                    process.stdout.write('\n')
                    process.exit(1)
                }
                if (char === '\r' || char === '\n') {
                    process.stdin.setRawMode(false)
                    process.stdin.pause()
                    process.stdin.off('data', onData)
                    process.stdout.write('\n')
                    resolve(value)
                    return
                }
                if (char === '\u007f' || char === '\b') {
                    value = value.slice(0, -1)
                    continue
                }
                value += char
            }
        }
        process.stdin.on('data', onData)
    })
}

async function moveOldSkillCopies() {
    const skillsDir = join(CLAUDE_DIR, 'skills')
    const oldCommand = join(CLAUDE_DIR, 'commands', 'ai-task.md')
    const repoSkill = await realpath(dirname(fileURLToPath(import.meta.url)))
    const entries = await readdir(skillsDir).catch(() => [])
    const oldSkills = await Promise.all(entries.map((entry) => oldSkillAt({ path: join(skillsDir, entry), repoSkill })))
    const hasOldCommand = (await lstat(oldCommand).catch(() => null)) !== null
    const oldCopies = [...oldSkills.filter(Boolean), ...(hasOldCommand ? [oldCommand] : [])]
    if (oldCopies.length === 0) {
        return
    }
    const backupDir = join(CLAUDE_DIR, 'ai-task-old', String(Date.now()))
    await mkdir(backupDir, { recursive: true })
    for (const path of oldCopies) {
        await rename(path, join(backupDir, basename(path)))
        console.log(`Moved an old copy of /ai-task (${path}) to ${backupDir}, so the repo's version loads.`)
    }
    console.log('')
}

async function oldSkillAt({ path, repoSkill }) {
    const real = await realpath(path).catch(() => null)
    if (!real || real === repoSkill) {
        return null
    }
    const skill = await readFile(join(path, 'SKILL.md'), 'utf8').catch(() => '')
    return /^name:\s*ai-task\s*$/m.test(skill) ? path : null
}

async function readSettings() {
    const raw = await readFile(SETTINGS_PATH, 'utf8').catch(() => '{}')
    try {
        return JSON.parse(raw)
    }
    catch {
        fail(`${SETTINGS_PATH} isn't valid JSON, so I didn't touch it. Fix it and run this again.`)
    }
}

function fail(message) {
    console.error(`\n${message}`)
    process.exit(1)
}
