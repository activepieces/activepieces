import axios, { AxiosError } from 'axios'
import { getAvailablePieceNames } from './utils/get-available-piece-names'
import { exec} from './utils/exec'
import { readFile } from 'node:fs/promises'

type PackageJson = {
  name: string
  version: string
}

type ProjectJson = {
  name: string
}

const latestPublishedVersion = async (packageName: string): Promise<string | null> => {
  try {
    const response = await axios<{version: string}>(`https://registry.npmjs.org/${packageName}/latest`)
    return response.data.version
  }
  catch (e: unknown) {
      if (e instanceof AxiosError && e.response?.status === 404) {
        return null
      }

      throw e
  }
}

const publishPiece = async (pieceName: string): Promise<void> => {
  const piecePackageJsonFile = await readFile(`packages/pieces/${pieceName}/package.json`, { encoding: 'utf-8' })
  const piecePackageJson: PackageJson = JSON.parse(piecePackageJsonFile)
  const latestVersion = await latestPublishedVersion(piecePackageJson.name)
  const currentVersion = piecePackageJson.version
  const versionAlreadyPublished = latestVersion !== null && currentVersion === latestVersion

  if (versionAlreadyPublished) {
    console.log(`${pieceName} v${currentVersion} already published`)
    return
  }

  const pieceProjectJsonFile = await readFile(`packages/pieces/${pieceName}/project.json`, { encoding: 'utf-8' })
  const pieceProjectJson: ProjectJson = JSON.parse(pieceProjectJsonFile)
  const nxProjectName = pieceProjectJson.name
  const nxPublishProjectCommand = `
    node tools/scripts/publish.mjs \
      ${nxProjectName} \
      ${currentVersion} \
      latest
  `

  await exec(nxPublishProjectCommand, {})

  console.log(`${pieceName} v${currentVersion} success`)
}

const main = async () => {
  const pieceNames = await getAvailablePieceNames()
  const publishResults = pieceNames.map(p => publishPiece(p))
  await Promise.all(publishResults)
}

main()
