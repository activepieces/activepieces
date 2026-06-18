import { existsSync } from 'node:fs'
import path from 'node:path'

function find(): string {
    let dir = __dirname
    for (let depth = 0; depth < 12; depth++) {
        if (existsSync(path.join(dir, '.git'))) {
            return dir
        }
        dir = path.dirname(dir)
    }
    throw new Error('chat-eval: could not locate the repo root (.git not found above this file)')
}

export const repoRoot = find()
