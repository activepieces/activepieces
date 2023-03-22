import { readFile, writeFile } from 'node:fs/promises'

export type PackageJson = {
  name: string
  version: string
}

export type ProjectJson = {
  name: string
  targets?: {
    build?: {
      options?: {
        buildableProjectDepsInPackageJsonType?: 'peerDependencies' | 'dependencies'
      }
    }
  }
}

const readJsonFile = async <T> (path: string): Promise<T> => {
  console.info(`[readJsonFile] path=${path}`)

  const jsonFile = await readFile(path, { encoding: 'utf-8' })
  return JSON.parse(jsonFile) as T
}

const writeJsonFile = async (path: string, data: unknown): Promise<void> => {
  console.info(`[writeJsonFile]`)

  const serializedData = JSON.stringify(data)
  await writeFile(path, serializedData, { encoding: 'utf-8' })
}

export const readPackageJson = async (path: string): Promise<PackageJson> => {
  return await readJsonFile(`${path}/package.json`)
}

export const readProjectJson = async (path: string): Promise<ProjectJson> => {
  return await readJsonFile(`${path}/project.json`)
}

export const writeProjectJson = async (path: string, projectJson: ProjectJson): Promise<void> => {
  return await writeJsonFile(`${path}/project.json`, projectJson)
}
