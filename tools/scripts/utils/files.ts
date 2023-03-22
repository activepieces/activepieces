import { readFile } from 'node:fs/promises'

export type PackageJson = {
  name: string
  version: string
}

export type ProjectJson = {
  name: string
}

const readJsonFile = async <T> (path: string): Promise<T> => {
  console.info(`[readJsonFile] path=${path}`)

  const jsonFile = await readFile(path, { encoding: 'utf-8' })
  return JSON.parse(jsonFile) as T
}

export const readPackageJson = async (path: string): Promise<PackageJson> => {
  return await readJsonFile(`${path}/package.json`)
}

export const readProjectJson = async (path: string): Promise<ProjectJson> => {
  return await readJsonFile(`${path}/project.json`)
}
