import { basename } from 'node:path'
import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { findPiece, findPieces, piecesPath } from '../utils/piece-utils'
import { migratePieceUtils } from '../utils/migrate-piece-utils'

function reportMigration({ pieceFolder, label, dryRun }: { pieceFolder: string, label: string, dryRun: boolean }): void {
    const report = migratePieceUtils.migratePiece({ piecePath: pieceFolder, dryRun })
    const changes = report.repointedFiles.length + (report.manifestChanged ? 1 : 0) + (report.eslintChanged ? 1 : 0)
    if (changes === 0) {
        console.info(chalk.gray(`• ${label} — already conformant`))
        return
    }
    console.info(chalk.green(`${dryRun ? '[dry run] ' : ''}✓ ${label}`))
    if (report.repointedFiles.length > 0) {
        console.info(`    repointed imports in ${report.repointedFiles.length} file(s) → @activepieces/pieces-framework`)
    }
    if (report.manifestChanged) {
        console.info('    updated package.json (dropped shared, added core build deps, moved tslib to devDependencies, added bundle script)')
    }
    if (report.eslintChanged) {
        console.info('    added the import-boundary lint rule')
    }
}

async function migrateByName({ pieceName, dryRun }: { pieceName: string, dryRun: boolean }): Promise<void> {
    const pieceFolder = await findPiece(pieceName)
    if (!pieceFolder) {
        console.error(chalk.red(`🚨 Piece '${pieceName}' not found under packages/pieces`))
        process.exit(1)
    }
    reportMigration({ pieceFolder, label: pieceName, dryRun })
}

async function migrateAll({ dryRun }: { dryRun: boolean }): Promise<void> {
    const folders = await findPieces(piecesPath())
    console.info(chalk.blue(`Migrating ${folders.length} piece(s)${dryRun ? ' (dry run)' : ''}...`))
    for (const folder of folders) {
        reportMigration({ pieceFolder: folder, label: basename(folder), dryRun })
    }
}

export const migratePieceCommand = new Command('migrate')
    .description('Migrate a piece to the self-contained bundle model: repoint imports to @activepieces/pieces-framework, fix package.json, and add the import-boundary lint rule')
    .argument('[name]', 'name of the piece to migrate')
    .option('--name <pieceName>', 'name of the piece to migrate')
    .option('--all', 'migrate every piece under packages/pieces')
    .option('--dry-run', 'report the changes without writing them')
    .action(async (positionalName, options) => {
        const dryRun = options.dryRun ?? false
        if (options.all) {
            await migrateAll({ dryRun })
        }
        else {
            const pieceName = positionalName ?? options.name ?? (await inquirer.prompt([
                { type: 'input', name: 'name', message: 'Enter the piece folder name' },
            ])).name
            await migrateByName({ pieceName, dryRun })
        }
        if (!dryRun) {
            console.info(chalk.yellow('\nNext: build the piece to verify, e.g. `npm run build-piece <name>`'))
        }
    })
