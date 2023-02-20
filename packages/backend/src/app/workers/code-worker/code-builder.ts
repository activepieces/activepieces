import fs from "node:fs";
import { ExecSyncOptionsWithBufferEncoding } from "node:child_process";
import decompress from "decompress";
import { sandboxManager } from "../sandbox";
import { exec } from "node:child_process";
import { logger } from "../../helper/logger";

const webpackConfig = `
  const path = require("node:path");
  module.exports = {
    target: "node",
    externalsPresets: { node: true },
    entry: "./index.js",
    resolve: {
      preferRelative: true,
      extensions: [".js"]
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

async function build(artifact: Buffer): Promise<Buffer> {
    const sandbox = sandboxManager.obtainSandbox();
    const buildPath = sandbox.getSandboxFolderPath();
    let bundledFile: Buffer;
    try {
        console.log("Started Building in sandbox " + buildPath);

        await sandbox.cleanAndInit();

        await downloadFiles(artifact, buildPath);

        const execOptions: ExecSyncOptionsWithBufferEncoding = {
            cwd: buildPath,
        };

        logger.info("Installing npm");
        await execPromise('npm install', execOptions);

        logger.info("Finished npm depdencies");
        await execPromise('npm exec -g webpack -- --mode production', execOptions);

        const bundledFilePath = buildPath + "/dist/index.js";
        bundledFile = fs.readFileSync(bundledFilePath);
        console.log("Finished Building in sandbox " + buildPath);
    }
    catch (e) {
        logger.error(e);
        const consoleError = e as { stdout: string };
        const invalidArtifactFile = fs
            .readFileSync("./packages/backend/src/assets/invalid-code.js")
            .toString("utf-8")
            .replace("${ERROR_MESSAGE}", JSON.stringify(consoleError.toString()).replace(/"/g, '\\"'));
        bundledFile = Buffer.from(invalidArtifactFile, "utf-8");
    }
    finally {
        sandboxManager.returnSandbox(sandbox.boxId);
    }
    return bundledFile;
}

async function execPromise(cmd: string, options: ExecSyncOptionsWithBufferEncoding): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd, options, (error: any, stdout: string | PromiseLike<string>, stderr: any) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                resolve(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

async function downloadFiles(artifact: Buffer, buildPath: string) {
    const packageJsonPath = `${buildPath}/package.json`;
    const webpackConfigPath = `${buildPath}/webpack.config.js`;

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

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
    fs.writeFileSync(webpackConfigPath, webpackConfig);
}

export const codeBuilder = {
    build,
};
