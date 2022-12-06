import * as fs from 'fs';
import * as unzip from 'unzip-stream';
import {globals} from '../globals';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

export class CodeExecutor {
  public async executeCode(artifact: string, params: any) {
    try {
      const codeFilePath = await this.prepareCode(artifact);
      return await this.runCode(artifact, codeFilePath, params);
    } catch (e) {
      throw Error((e as Error).message);
    }
  }

  private async runCode(artifactId: string, codeFilePath: string, params: any) {
    try {
      const {stdout, stderr} = await exec(`node ${globals.executorFile} ${codeFilePath} ${JSON.stringify(params)}`);

      if (stderr) {
        throw Error(stderr);
      }

      return stdout;
    } catch (e) {
      throw Error(
        `Error in executing artifact (${artifactId}): ${(e as Error).message}`
      );
    }
  }

  private async prepareCode(artifact: string) {
    try {
      const artifactPath = `${globals.codeDirectory}/${artifact}`;
      const extractedArtifactPath = `${artifactPath}-extracted`;

      if (!fs.existsSync(extractedArtifactPath)) {
        await this.extract(artifactPath, extractedArtifactPath);
      }

      return `${extractedArtifactPath}/build/index.js`;
    } catch (e) {
      throw Error(`Error in artifact preparation: ${(e as Error).message}`);
    }
  }

  private async extract(artifactPath: string, extractedArtifactPath: string) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(artifactPath)
        .on('error', err => {
          reject(
            new Error(
              `Failed reading artifact (${artifactPath}): ${err.message}.`
            )
          );
        })
        .pipe(unzip.Extract({path: extractedArtifactPath}))
        .on('close', resolve)
        .on('error', err => {
          reject(
            new Error(
              `Failed extracting artifact (${artifactPath}): ${err.message}`
            )
          );
        });
    });
  }
}
