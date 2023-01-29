import fs from "node:fs";
import { execSync, ExecSyncOptionsWithBufferEncoding } from "node:child_process";
import decompress from "decompress";
import { sandboxManager } from "../sandbox";
import { logger } from "packages/backend/src/main";

const webpackConfig = `
  const path = require("node:path");
  module.exports = {
    target: "node",
    devtool: false,
    externalsPresets: { node: true },
    entry: "./index.ts",
    module: {
      rules: [
        {
         use: 'ts-loader',
         exclude: /node_modules/
        }
      ]
    },
    resolve: {
      preferRelative: true,
      extensions: ['.ts', '.js', 'jsx', 'tsx']
    },
    output: {
      libraryTarget: "commonjs2",
      path: path.join(__dirname, "dist"),
      filename: "index.js",
    },
    optimization: {
      minimize: true,
    },
  };
`;

const tsConfig = `
{
  "compilerOptions": {
    "lib" : ["es2019"],
    "module": "commonjs",
    "moduleResolution": "Node",
    "sourceMap": true,
    "rootDir": ".",
    "outDir": "dist"
  }
}
`;

async function build(artifact: Buffer): Promise<Buffer> {
  const sandbox = sandboxManager.obtainSandbox();
  const buildPath = sandbox.getSandboxFolderPath();
  let bundledFile: Buffer;
  try {
    const startTime = new Date().getTime();
    logger.info("Started Building in sandbox " + buildPath);

    await sandbox.cleanAndInit();

    await downloadFiles(artifact, buildPath);

    const execOptions: ExecSyncOptionsWithBufferEncoding = {
      cwd: buildPath,
    };

    execSync('npm install --prefer-offline', execOptions);
    logger.info(`npm installation in sandbox ${buildPath} took ${new Date().getTime() - startTime} ms`);
    execSync('npm exec -g webpack -- --mode production', execOptions);

    const bundledFilePath = buildPath + "/dist/index.js";
    bundledFile = fs.readFileSync(bundledFilePath);
    logger.info(`Finished Building in sandbox ${buildPath} took ${new Date().getTime() - startTime} ms`);
  } catch (e) {
    const consoleError = e as { stdout: string };
    const invalidArtifactFile = fs
      .readFileSync("./packages/backend/src/assets/invalid-code.js")
      .toString("utf-8")
      .replace("${ERROR_MESSAGE}", JSON.stringify(consoleError.stdout.toString()).replace(/"/g, '\\"'));
    bundledFile = Buffer.from(invalidArtifactFile, "utf-8");
  } finally {
    sandboxManager.returnSandbox(sandbox.boxId);
  }
  return bundledFile;
}

async function downloadFiles(artifact: Buffer, buildPath: string) {
  const packageJsonPath = `${buildPath}/package.json`;
  const webpackConfigPath = `${buildPath}/webpack.config.js`;
  const tsConfigPath = `${buildPath}/tsconfig.json`;

  await decompress(artifact, buildPath, {});

  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, {
      encoding: "utf8",
      flag: "r",
    })
  );

  if (packageJson.scripts === undefined) {
    packageJson.scripts = {};
  }
  if (packageJson.devDependencies === undefined) {
    packageJson.devDependencies = {};
  }

  packageJson.devDependencies['typescript'] = "4.0.3";
  packageJson.devDependencies['ts-loader'] = "8.3.0";

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
  fs.writeFileSync(webpackConfigPath, webpackConfig);
  fs.writeFileSync(tsConfigPath, tsConfig);
}

export const codeBuilder = {
  build,
};
