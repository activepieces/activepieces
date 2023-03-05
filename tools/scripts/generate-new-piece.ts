import assert from 'node:assert'
import { argv } from 'node:process'
import { exec as execCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir, rm, writeFile } from 'node:fs/promises'

const exec = promisify(execCallback)

const availablePiecePackages = async () => {
  const packages = await readdir('packages/pieces')
  const frameworkPackage = 'framework'
  return packages.filter(p => p !== frameworkPackage)
}

const validatePieceName = async (pieceName: string) => {
  assert(pieceName, 'pieceName is not provided')

  const pieceNamePattern = /^[A-Za-z0-9\-]+$/
  assert(pieceNamePattern.test(pieceName), 'piece name should contain alphanumeric characters and hyphens only')

  const pieces = await availablePiecePackages()
  const nameAlreadyExists = pieces.some(p => p === pieceName)
  assert(!nameAlreadyExists, 'piece name already exists')
}

const nxGenerateNodeLibrary = async (pieceName: string) => {
  const nxGenerateCommand = `
    npx nx generate @nrwl/node:library ${pieceName} \
      --directory=pieces \
      --importPath=@activepieces/piece-${pieceName} \
      --publishable \
      --buildable \
      --standaloneConfig \
      --strict \
      --unitTestRunner=none
  `

  await exec(nxGenerateCommand)
}

const setupGeneratedLibrary = async (pieceName: string) => {
  await rm(`packages/pieces/${pieceName}/.babelrc`)
  await rm(`packages/pieces/${pieceName}/src/lib/pieces-${pieceName}.ts`)

  const pieceNameCamelCase = pieceName
    .split('-')
    .map((s, i) => {
      if (i === 0) {
        return s
      }

      return s[0].toUpperCase() + s.substring(1)
    })
    .join('')

  const indexTemplate = `
    import { createPiece } from '@activepieces/framework';
    import packageJson from '../package.json';

    export const ${pieceNameCamelCase} = createPiece({
      name: '${pieceName}',
      displayName: '${pieceName}',
      logoUrl: 'https://cdn.activepieces.com/pieces/${pieceName}.png',
      version: packageJson.version,
      authors: [
      ],
      actions: [
      ],
      triggers: [
      ],
    });
  `

  await writeFile(`packages/pieces/${pieceName}/src/index.ts`, indexTemplate)
}

const main = async () => {
  const [, , pieceName] = argv

  await validatePieceName(pieceName)
  await nxGenerateNodeLibrary(pieceName)
  await setupGeneratedLibrary(pieceName)
}

main()
