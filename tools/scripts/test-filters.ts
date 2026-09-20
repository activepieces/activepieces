import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const RUN_IN_THEIR_OWN_JOB = ['api']

function packagesDefiningTest(): string[] {
    const listed = execSync('npx turbo ls --output=json', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
    const { packages }: { packages: { items: { name: string, path: string }[] } } = JSON.parse(listed)
    return packages.items
        .filter(({ path }) => {
            const { scripts }: { scripts?: Record<string, string> } = JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8'))
            return scripts?.test !== undefined
        })
        .map(({ name }) => name)
        .filter((name) => !RUN_IN_THEIR_OWN_JOB.includes(name))
        .sort()
}

console.log(packagesDefiningTest().map((name) => `--filter=${name}`).join(' '))
