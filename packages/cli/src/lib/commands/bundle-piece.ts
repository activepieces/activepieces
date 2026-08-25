import { cwd } from 'node:process'
import { Command } from 'commander'
import chalk from 'chalk'
import { preparePieceDistForPublish } from '../utils/prepare-piece-utils'

async function bundlePieceInDir(piecePath: string): Promise<void> {
    await preparePieceDistForPublish(piecePath)
    console.info(chalk.green(`Bundled piece at ${piecePath}.`))
}

export const bundlePieceCommand = new Command('bundle')
    .description('Bundle a single piece in place (turbo runs this per package)')
    .argument('[path]', 'path to the piece folder')
    .action(async (piecePath?: string) => {
        await bundlePieceInDir(piecePath ?? cwd())
    })
