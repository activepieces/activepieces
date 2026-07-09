import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { ChatEvalFixture } from './fixture'

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

function load(): ChatEvalFixture[] {
    return readdirSync(FIXTURES_DIR)
        .filter((file) => file.endsWith('.json'))
        .map((file) => JSON.parse(readFileSync(path.join(FIXTURES_DIR, file), 'utf-8')) as ChatEvalFixture)
}

export const evalFixtures = {
    load,
}
