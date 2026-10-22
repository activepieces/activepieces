import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json')
const KEY_PAGE = 'https://linear.app/settings/account/security'

async function main() {
    if (!process.stdin.isTTY) {
        fail('Run this in your own terminal (not inside Claude Code), so the key stays hidden.')
    }
    console.log(`1. Open ${KEY_PAGE}`)
    console.log('2. New key, name it "Activepieces · <your name>\'s Claude (ai-task)", copy it')
    const key = (await askHidden('3. Paste it here (hidden) and press Enter: ')).trim()
    if (!key.startsWith('lin_api_')) {
        fail('That doesn\'t look like a Linear key. It should start with lin_api_.')
    }
    const name = await whoOwns({ key })
    const settings = await readSettings()
    const updated = { ...settings, env: { ...settings.env, LINEAR_API_KEY: key } }
    await mkdir(dirname(SETTINGS_PATH), { recursive: true })
    await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2) + '\n')
    if (process.platform !== 'win32') {
        await chmod(SETTINGS_PATH, 0o600)
    }
    console.log(`\nSaved for ${name}. Restart Claude Code and you're set.`)
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

async function whoOwns({ key }) {
    const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { Authorization: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ viewer { name } }' }),
    }).catch(() => fail('Couldn\'t reach Linear. Check your internet and try again.'))
    const body = await response.json().catch(() => ({}))
    const name = body?.data?.viewer?.name
    if (!response.ok || !name) {
        fail('Linear didn\'t accept that key. Make a new one and try again.')
    }
    return name
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

await main()
