import assert from 'node:assert'
import { argv } from 'node:process'
import { exec } from '../utils/exec'
import { readPackageJson, readProjectJson } from '../utils/files'
import { findPiece } from '../utils/piece-script-utils'

export const publishPiece = async (name: string): Promise<void> => {
  assert(name, '[publishPiece] parameter "name" is required')

  const piece = await findPiece(name);
  if (!piece) {
    throw new Error(`[publishPiece] piece not found, name=${name}`)
  }
  const directory = piece.directoryPath!
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

  console.info(`[publishPiece] success, name=${name}, version=${version}`)

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
