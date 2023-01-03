import { globals } from '../globals';

export class CodeExecutor {
  public async executeCode(artifact: string, params: any) {
    try {
      const artifactJs = artifact + '.js';
      const artifactPath = `${globals.codeDirectory}/${artifactJs}`;

      return await this.runCode(artifactPath, params);
    } catch (e) {
      throw e;
    }
  }

  private async runCode(codeFilePath: string, params: any) {
    return await require(codeFilePath).code(params);
  }
}
