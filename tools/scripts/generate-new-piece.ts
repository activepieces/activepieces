import assert from 'node:assert'
import { argv } from 'node:process'
import { rm, writeFile } from 'node:fs/promises'
import { getAvailablePieceNames } from './utils/get-available-piece-names'
import { exec } from './utils/exec'
import { readPackageEslint, readPackageJson, readProjectJson, writePackageEslint, writeProjectJson } from './utils/files'
import chalk from 'chalk';

const validatePieceName = async (pieceName: string) => {
  assert(pieceName, 'pieceName is not provided')

  const pieceNamePattern = /^[A-Za-z0-9\-]+$/
  assert(pieceNamePattern.test(pieceName), 'piece name should contain alphanumeric characters and hyphens only')

  const pieces = await getAvailablePieceNames()
  const nameAlreadyExists = pieces.some(p => p === pieceName)
  assert(!nameAlreadyExists, 'piece name already exists')
}

const nxGenerateNodeLibrary = async (pieceName: string) => {
  const nxGenerateCommand = `
    npx nx generate @nx/node:library ${pieceName} \
      --directory=pieces \
      --importPath=@activepieces/piece-${pieceName} \
      --publishable \
      --buildable \
      --standaloneConfig \
      --strict \
      --unitTestRunner=none
  `

  console.log(nxGenerateCommand);

  await exec(nxGenerateCommand)
}

const removeUnusedFiles = async (pieceName: string) => {
  await rm(`packages/pieces/${pieceName}/src/lib/pieces-${pieceName}.ts`)
}

const generateIndexTsFile = async (pieceName: string) => {
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
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const ${pieceNameCamelCase} = createPiece({
  displayName: "${capitalizeFirstLetter(pieceName)}",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/${pieceName}.png",
  authors: [],
  actions: [],
  triggers: [],
});
`

  await writeFile(`packages/pieces/${pieceName}/src/index.ts`, indexTemplate)
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


const updateProjectJsonConfig = async (pieceName: string) => {
  const projectJson = await readProjectJson(`packages/pieces/${pieceName}`)

  assert(projectJson.targets?.build?.options, '[updateProjectJsonConfig] targets.build.options is required');

  projectJson.targets.build.options.buildableProjectDepsInPackageJsonType = 'dependencies'
  projectJson.targets.build.options.updateBuildableProjectDepsInPackageJson = true

  const lintFilePatterns = projectJson.targets.lint.options.lintFilePatterns
  const patternIndex = lintFilePatterns.findIndex((item => item.endsWith('package.json')))
  if (patternIndex !== -1) lintFilePatterns?.splice(patternIndex, 1)
  await writeProjectJson(`packages/pieces/${pieceName}`, projectJson)
}


const updatePackageJsonConfig = async (pieceName: string) => {
  const projectJson = await readPackageJson(`packages/pieces/${pieceName}`)
  projectJson.keywords = ['activepieces'];
  await writeProjectJson(`packages/pieces/${pieceName}`, projectJson)
}

const updateEslintFile = async (pieceName: string) => {
    const eslintFile = await readPackageEslint(`packages/pieces/${pieceName}`)
    eslintFile.overrides.splice(eslintFile.overrides.findIndex((rule: any) => rule.files[0] == '*.json'), 1)
    await writePackageEslint(`packages/pieces/${pieceName}`, eslintFile)
}

const setupGeneratedLibrary = async (pieceName: string) => {
  await removeUnusedFiles(pieceName)
  await generateIndexTsFile(pieceName)
  await updateProjectJsonConfig(pieceName)
  await updateEslintFile(pieceName)
}

const main = async () => {
  const [, , pieceName] = argv

  await validatePieceName(pieceName)
  await nxGenerateNodeLibrary(pieceName)
  await setupGeneratedLibrary(pieceName)
  console.log(chalk.green('✨  Done!'));
  console.log(chalk.yellow(`The piece has been generated at: packages/pieces/${pieceName}`));
}

main()
