import { appendFileSync } from 'fs'
import { crowdinProjectApi } from './crowdin-project-api'
import { jobSummary } from './job-summary'
import { JournalEntry, renameJournal } from './rename-journal'
import { renamePlan } from './rename-plan'
import { renameRun, RenameTotals } from './rename-run'
import { renameUndo } from './rename-undo'
import { translatableTextByJsonPath } from './translatable-text-by-json-path'

function commandOf({ commandLineArguments }: { commandLineArguments: string[] }): CrowdinRenameCommand {
    const flagValue = (flag: string): string | undefined => {
        const flagIndex = commandLineArguments.indexOf(flag)
        return flagIndex === -1 ? undefined : commandLineArguments[flagIndex + 1]
    }
    const journalFile = flagValue('--journal') ?? DEFAULT_JOURNAL_FILE
    const undoJournalFile = flagValue('--undo')
    if (undoJournalFile !== undefined) {
        return { kind: 'undo', undoJournalFile, journalFile }
    }
    const previousDirectory = flagValue('--previous')
    const currentDirectory = flagValue('--current')
    if (previousDirectory === undefined || currentDirectory === undefined) {
        throw new Error('pass --previous <dir> and --current <dir>, or --undo <journal>')
    }
    return { kind: 'rename', previousDirectory, currentDirectory, journalFile }
}

function renameExitCodeOf({ totals }: { totals: RenameTotals }): number {
    return totals.failed > 0 && totals.crowdinWrites === 0 ? 1 : 0
}

function publishToGithubJob({ summary, outputs }: { summary: string, outputs: Record<string, number> }): void {
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`)
    }
    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(outputs).map(([name, value]) => `${name}=${value}\n`).join(''))
    }
}

async function main(): Promise<void> {
    const token = process.env.CROWDIN_RENAME_TOKEN
    const projectId = process.env.CROWDIN_PROJECT_ID
    if (!token || !projectId) {
        publishToGithubJob({ summary: jobSummary.noticeSummary({ notice: 'Skipped: CROWDIN_RENAME_TOKEN or CROWDIN_PROJECT_ID is not set.' }), outputs: { renamed: 0, failed: 0 } })
        return
    }
    try {
        const command = commandOf({ commandLineArguments: process.argv.slice(2) })
        if (command.kind === 'undo') {
            await undoFromJournal({ token, projectId: Number(projectId), command })
        }
        else {
            await renameFromDirectories({ token, projectId: Number(projectId), command })
        }
    }
    catch (error) {
        publishToGithubJob({
            summary: jobSummary.noticeSummary({ notice: `Stopped before any change in Crowdin: ${crowdinProjectApi.shortErrorMessageOf({ error })}` }),
            outputs: { renamed: 0, failed: 1 },
        })
        process.exitCode = 1
    }
}

async function undoFromJournal({ token, projectId, command }: { token: string, projectId: number, command: UndoCommand }): Promise<void> {
    const totals = await renameUndo.undoRenames({
        crowdin: crowdinProjectApi.create({ token, projectId }),
        journalEntries: renameJournal.readEntries({ journalFile: command.undoJournalFile }),
        appendJournalEntry: renameJournal.appenderTo({ journalFile: command.journalFile }),
    })
    publishToGithubJob({ summary: jobSummary.undoSummary({ totals }), outputs: { undone: totals.undone, failed: totals.failed } })
    process.exitCode = totals.failed > 0 ? 1 : 0
}

async function renameFromDirectories({ token, projectId, command }: { token: string, projectId: number, command: RenameCommand }): Promise<void> {
    const pieces = translatableTextByJsonPath.readPieces({ previousDirectory: command.previousDirectory, currentDirectory: command.currentDirectory })
        .filter(({ oldEnglishByJsonPath, newEnglishByJsonPath }) => renamePlan.englishEditsOf({ oldEnglishByJsonPath, newEnglishByJsonPath }).length > 0)
    if (pieces.length === 0) {
        publishToGithubJob({ summary: jobSummary.noticeSummary({ notice: 'No English text changed, nothing to rename.' }), outputs: { renamed: 0, failed: 0 } })
        return
    }
    const appendToJournalFile = renameJournal.appenderTo({ journalFile: command.journalFile })
    const journalEntries: JournalEntry[] = []
    const totals = await renameRun.renamePieces({
        crowdin: crowdinProjectApi.create({ token, projectId }),
        pieces,
        appendJournalEntry: (entry) => {
            journalEntries.push(entry)
            appendToJournalFile(entry)
        },
    })
    publishToGithubJob({ summary: jobSummary.renameSummary({ journalEntries, totals }), outputs: { renamed: totals.renamed, failed: totals.failed } })
    process.exitCode = renameExitCodeOf({ totals })
}

const DEFAULT_JOURNAL_FILE = 'crowdin-rename-journal.jsonl'

export const crowdinRename = { commandOf, renameExitCodeOf }

type RenameCommand = {
    kind: 'rename'
    previousDirectory: string
    currentDirectory: string
    journalFile: string
}

type UndoCommand = {
    kind: 'undo'
    undoJournalFile: string
    journalFile: string
}

type CrowdinRenameCommand = RenameCommand | UndoCommand

if (import.meta.main) {
    main().catch((error: unknown) => {
        console.error(`❌ Crowdin rename failed: ${crowdinProjectApi.shortErrorMessageOf({ error })}`)
        process.exit(1)
    })
}
