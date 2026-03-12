import {
  constants,
  readFile,
  access,
  mkdir,
} from 'node:fs/promises';

export type PackageJson = {
  name: string;
  version: string;
  keywords: string[];
};

export const checkIfFileExists = async (filePath: string) => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
};

const readJsonFile = async <T>(path: string): Promise<T> => {
  const jsonFile = await readFile(path, { encoding: 'utf-8' });
  return JSON.parse(jsonFile) as T;
};

export const readPackageJson = async (path: string): Promise<PackageJson> => {
  return await readJsonFile(`${path}/package.json`);
};

export const makeFolderRecursive = async (path: string): Promise<void> => {
  await mkdir(path, { recursive: true });
};
