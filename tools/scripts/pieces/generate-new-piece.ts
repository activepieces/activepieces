import assert from 'node:assert'
import { argv } from 'node:process'
import { rm, writeFile } from 'node:fs/promises'
import { exec } from '../utils/exec'
import { readPackageEslint, readProjectJson, writePackageEslint, writeProjectJson } from '../utils/files'
import chalk from 'chalk';
import { join } from 'node:path'
import { getCommunityPieceFolder } from '../utils/piece-script-utils'

const validatePieceName = async (pieceName: string) => {
  assert(pieceName, 'pieceName is not provided')

  const pieceNamePattern = /^[A-Za-z0-9\-]+$/
  assert(pieceNamePattern.test(pieceName), 'piece name should contain alphanumeric characters and hyphens only')
}

const nxGenerateNodeLibrary = async (pieceName: string) => {
  const nxGenerateCommand = `
    npx nx generate @nx/node:library ${pieceName} \
      --directory=pieces/community \
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

const removeUnusedFiles = async (piecePath: string, pieceName: string) => {
  const pieceTsFile = join(piecePath, 'src', 'lib');

  // Empty the folder
  await rm(pieceTsFile, { recursive: true, force: true });
}

const generateIndexTsFile = async (piecePath: string, pieceName: string) => {
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

  await writeFile(join(piecePath, 'src', 'index.ts'), indexTemplate)
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


const updateProjectJsonConfig = async (piecePath: string) => {
  const projectJson = await readProjectJson(piecePath)

  assert(projectJson.targets?.build?.options, '[updateProjectJsonConfig] targets.build.options is required');

  projectJson.targets.build.options.buildableProjectDepsInPackageJsonType = 'dependencies'
  projectJson.targets.build.options.updateBuildableProjectDepsInPackageJson = true

  const lintFilePatterns = projectJson.targets.lint.options.lintFilePatterns
  const patternIndex = lintFilePatterns.findIndex((item => item.endsWith('package.json')))
  if (patternIndex !== -1) lintFilePatterns?.splice(patternIndex, 1)
  await writeProjectJson(piecePath, projectJson)
}


const updateEslintFile = async (piecePath: string) => {
  const eslintFile = await readPackageEslint(piecePath)
  eslintFile.overrides.splice(eslintFile.overrides.findIndex((rule: any) => rule.files[0] == '*.json'), 1)
  await writePackageEslint(piecePath, eslintFile)
}

const setupGeneratedLibrary = async (pieceName: string) => {
  const piecePath = getCommunityPieceFolder(pieceName)
  await removeUnusedFiles(piecePath, pieceName)
  await generateIndexTsFile(piecePath, pieceName)
  await updateProjectJsonConfig(piecePath)
  await updateEslintFile(piecePath)
}

const main = async () => {
  const [, , pieceName] = argv

  const piecePath = getCommunityPieceFolder(pieceName)

  await validatePieceName(pieceName)
  await nxGenerateNodeLibrary(pieceName)
  await setupGeneratedLibrary(pieceName)
  console.log(chalk.green('✨  Done!'));
  console.log(chalk.yellow(`The piece has been generated at: ${piecePath}`));
}

main()
