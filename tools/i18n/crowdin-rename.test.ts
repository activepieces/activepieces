import { afterEach, describe, expect, it } from 'bun:test'
import { spawnSync } from 'child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { crowdinRename } from './crowdin-rename'

const temporaryDirectories: string[] = []

const runScript = ({ commandLineArguments, environment }: { commandLineArguments: string[], environment: Record<string, string> }) => {
    const workDirectory = mkdtempSync(join(tmpdir(), 'ap-crowdin-rename-cli-'))
    temporaryDirectories.push(workDirectory)
    const githubOutputFile = join(workDirectory, 'github-output')
    writeFileSync(githubOutputFile, '')
    const scriptRun = spawnSync(process.execPath, [join(import.meta.dirname, 'crowdin-rename.ts'), ...commandLineArguments], {
        cwd: workDirectory,
        encoding: 'utf8',
        env: { PATH: process.env.PATH ?? '', GITHUB_OUTPUT: githubOutputFile, ...environment },
    })
    return { workDirectory, exitCode: scriptRun.status, printedSummary: scriptRun.stdout, githubOutputs: readFileSync(githubOutputFile, 'utf8') }
}

afterEach(() => {
    temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }))
})

describe('crowdin-rename.ts run from the command line', () => {
    it('skips without a token and blocks nothing', () => {
        const scriptRun = runScript({ commandLineArguments: ['--previous', 'old', '--current', 'new'], environment: {} })

        expect(scriptRun.exitCode).toBe(0)
        expect(scriptRun.printedSummary).toContain('Skipped: CROWDIN_RENAME_TOKEN or CROWDIN_PROJECT_ID is not set.')
        expect(scriptRun.githubOutputs).toBe('renamed=0\nfailed=0\n')
    })

    it('renames nothing on the first night, when there is no previous directory', () => {
        const environment = { CROWDIN_RENAME_TOKEN: 'never-sent', CROWDIN_PROJECT_ID: '42' }
        const currentDirectory = mkdtempSync(join(tmpdir(), 'ap-crowdin-rename-current-'))
        temporaryDirectories.push(currentDirectory)
        mkdirSync(join(currentDirectory, 'community'))
        writeFileSync(join(currentDirectory, 'community', 'dropbox.json'), JSON.stringify({ description: 'New' }))

        const scriptRun = runScript({ commandLineArguments: ['--previous', join(currentDirectory, 'missing'), '--current', currentDirectory, '--journal', 'journal.jsonl'], environment })

        expect(scriptRun.exitCode).toBe(0)
        expect(scriptRun.printedSummary).toContain('No English text changed, nothing to rename.')
        expect(scriptRun.printedSummary).not.toContain('never-sent')
        expect(scriptRun.githubOutputs).toBe('renamed=0\nfailed=0\n')
    })

    it('stops before any change in Crowdin when the current directory is missing', () => {
        const environment = { CROWDIN_RENAME_TOKEN: 'never-sent', CROWDIN_PROJECT_ID: '42' }

        const scriptRun = runScript({ commandLineArguments: ['--previous', 'old', '--current', 'missing'], environment })

        expect(scriptRun.exitCode).toBe(1)
        expect(scriptRun.printedSummary).toContain('Stopped before any change in Crowdin')
        expect(scriptRun.githubOutputs).toBe('renamed=0\nfailed=1\n')
    })
})

describe('crowdinRename.commandOf', () => {
    it('renames from the previous and current directories', () => {
        const command = crowdinRename.commandOf({ commandLineArguments: ['--previous', 'old-dir', '--current', 'new-dir', '--journal', 'journal.jsonl'] })

        expect(command).toEqual({ kind: 'rename', previousDirectory: 'old-dir', currentDirectory: 'new-dir', journalFile: 'journal.jsonl' })
    })

    it('undoes from a journal and writes its own journal', () => {
        const command = crowdinRename.commandOf({ commandLineArguments: ['--undo', 'run.jsonl', '--journal', 'undo.jsonl'] })

        expect(command).toEqual({ kind: 'undo', undoJournalFile: 'run.jsonl', journalFile: 'undo.jsonl' })
    })

    it('writes the journal to a default file when none is given', () => {
        const command = crowdinRename.commandOf({ commandLineArguments: ['--previous', 'old-dir', '--current', 'new-dir'] })

        expect(command).toMatchObject({ journalFile: 'crowdin-rename-journal.jsonl' })
    })

    it('stops when a directory is missing from the command', () => {
        expect(() => crowdinRename.commandOf({ commandLineArguments: ['--current', 'new-dir'] })).toThrow('--previous')
        expect(() => crowdinRename.commandOf({ commandLineArguments: ['--previous', 'old-dir'] })).toThrow('--current')
    })
})

describe('crowdinRename.renameExitCodeOf', () => {
    it('fails closed only when something failed before any write', () => {
        const noRenames = { renamed: 0, skipped: 0, failed: 0, crowdinWrites: 0 }

        expect(crowdinRename.renameExitCodeOf({ totals: { ...noRenames, failed: 2 } })).toBe(1)
        expect(crowdinRename.renameExitCodeOf({ totals: { ...noRenames, failed: 1, renamed: 3, crowdinWrites: 3 } })).toBe(0)
        expect(crowdinRename.renameExitCodeOf({ totals: noRenames })).toBe(0)
    })
})
