import {
  constants,
  readFile,
  access,
  writeFile,
  mkdir,
} from 'node:fs/promises';

export type PackageJson = {
  name: string;
  version: string;
  keywords: string[];
};

export type ProjectJson = {
  name: string;
  targets?: {
    build?: {
      options?: {
        buildableProjectDepsInPackageJsonType?:
          | 'peerDependencies'
          | 'dependencies';
        updateBuildableProjectDepsInPackageJson: boolean;
        assets?: ({
          input: string;
          output: string;
          glob: string;
        } | string)[];
      };
    };
    lint: {
      executor: string;
      outputs: string[];
      options?: {
        lintFilePatterns: string[];
      };
    };
  };
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

const writeJsonFile = async (path: string, data: unknown): Promise<void> => {
  const serializedData = JSON.stringify(data, null, 2);
  await writeFile(path, serializedData, { encoding: 'utf-8' });
};

export const readPackageJson = async (path: string): Promise<PackageJson> => {
  return await readJsonFile(`${path}/package.json`);
};

export const readProjectJson = async (path: string): Promise<ProjectJson> => {
  return await readJsonFile(`${path}/project.json`);
};

export const readPackageEslint = async (path: string): Promise<any> => {
  return await readJsonFile(`${path}/.eslintrc.json`);
};

export const writePackageEslint = async (
  path: string,
  eslint: any
): Promise<void> => {
  return await writeJsonFile(`${path}/.eslintrc.json`, eslint);
};

export const writeProjectJson = async (
  path: string,
  projectJson: ProjectJson
): Promise<void> => {
  return await writeJsonFile(`${path}/project.json`, projectJson);
};

export const makeFolderRecursive = async (path: string): Promise<void> => {
  await mkdir(path, { recursive: true });
};
