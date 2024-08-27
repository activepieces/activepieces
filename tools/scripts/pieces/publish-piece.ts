import assert from 'node:assert'
import { argv } from 'node:process'
import { exec } from '../utils/exec'
import { readPackageJson, readProjectJson } from '../utils/files'
import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { isNil } from '../../../packages/shared/src'
import chalk from 'chalk'

export const publishPiece = async (name: string): Promise<void> => {
  assert(name, '[publishPiece] parameter "name" is required')

  const distPaths = await findAllPiecesDirectoryInSource()
  const directory = distPaths.find(path => {
    if (path.endsWith(`/${name}`)) {
      return true;
    }
    return false
  })
  if (isNil(directory)) {
    console.error(chalk.red(`[publishPiece] can't find the directory with name ${name}`))
    return
  }
  const { version } = await readPackageJson(directory)
  const { name: nxProjectName } = await readProjectJson(directory)

  await exec(`npx nx build ${nxProjectName}`)

  
  const nxPublishProjectCommand = `
    node tools/scripts/publish.mjs \
      ${nxProjectName} \
      ${version} \
      latest
  `


  await exec(nxPublishProjectCommand)

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
