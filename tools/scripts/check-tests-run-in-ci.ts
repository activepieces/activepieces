import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CI_WORKFLOW = '.github/workflows/ci.yml'
// Driven by the dedicated playwright workflow rather than a turbo filter.
const RUN_OUTSIDE_TURBO = ['tests-e2e']

function packagesWithTests(): { name: string, dir: string }[] {
    const raw = execSync('npx turbo ls --output=json', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
    const parsed: { packages: { items: { name: string, path: string }[] } } = JSON.parse(raw)
    return parsed.packages.items
        .map((item) => ({ name: item.name, dir: item.path }))
        .filter(({ dir }) => {
            const manifest = join(dir, 'package.json')
            if (!existsSync(manifest)) {
                return false
            }
            const scripts: Record<string, string> = JSON.parse(readFileSync(manifest, 'utf-8')).scripts ?? {}
            return Object.keys(scripts).some((script) => script === 'test' || script.startsWith('test-'))
        })
}

function selectedByCi(name: string, workflow: string): boolean {
    if (workflow.includes(`--filter=${name}`) || workflow.includes(`--filter='${name}'`)) {
        return true
    }
    const globs = [...workflow.matchAll(/--filter='([^']*\*[^']*)'/g)].map((match) => match[1])
    return globs.some((glob) => new RegExp(`^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`).test(name))
}

const workflow = readFileSync(CI_WORKFLOW, 'utf-8')
const unreachable = packagesWithTests().filter(({ name }) => !RUN_OUTSIDE_TURBO.includes(name) && !selectedByCi(name, workflow))

if (unreachable.length > 0) {
    console.error(`${unreachable.length} package(s) declare tests that no CI filter selects, so they never run:`)
    unreachable.forEach(({ name }) => console.error(`  ${name}`))
    console.error(`\nAdd a --filter for them in ${CI_WORKFLOW}, or drop the unused test script.`)
    process.exit(1)
}

console.log(`All ${packagesWithTests().length} packages that declare tests are selected by a CI filter.`)
