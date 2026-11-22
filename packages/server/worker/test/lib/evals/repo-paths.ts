import { existsSync } from 'node:fs'
import path from 'node:path'

function root(): string {
    const found = [...Array(MAX_DEPTH).keys()]
        .map((depth) => path.resolve(__dirname, ...Array<string>(depth).fill('..')))
        .find((dir) => existsSync(path.join(dir, '.git')))
    if (found === undefined) {
        throw new Error('evals: could not find the repo root above this file')
    }
    return found
}

function envFile(): string {
    return path.join(root(), ENV_FILE_NAME)
}

const MAX_DEPTH = 12
const ENV_FILE_NAME = '.env.dev'

export const repoPaths = {
    root,
    envFile,
}
