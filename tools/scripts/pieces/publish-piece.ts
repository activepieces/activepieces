import assert from 'node:assert'
import { argv } from 'node:process'
import { exec } from '../utils/exec'
import { readPackageJson } from '../utils/files'
import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { isNil } from '@activepieces/shared'
import chalk from 'chalk'
import path from 'node:path'
import { publishNpmPackage } from '../utils/publish-npm-package'

export const publishPiece = async (name: string): Promise<void> => {
  assert(name, '[publishPiece] parameter "name" is required')

  const distPaths = await findAllPiecesDirectoryInSource()
  const directory = distPaths.find(p => path.basename(p) === name)
  if (isNil(directory)) {
    console.error(chalk.red(`[publishPiece] can't find the directory with name ${name}`))
    return
  }

  await exec(`turbo run build --filter=./packages/pieces/community/${name}`)

  await publishNpmPackage(directory)

  const { version } = await readPackageJson(directory)
  console.info(chalk.green.bold(`[publishPiece] success, name=${name}, version=${version}`))
}

const main = async (): Promise<void> => {
  const pieceName = argv[2]
  await publishPiece(pieceName)
}

/*
 * module is entrypoint, not imported i.e. invoked directly
 * see https://nodejs.org/api/modules.html#modules_accessing_the_main_module
 */
if (require.main === module) {
  main()
}
