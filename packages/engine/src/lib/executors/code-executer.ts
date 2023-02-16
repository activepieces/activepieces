import { globals } from '../globals';

export class CodeExecutor {
  public async executeCode(artifact: string, params: any) {
      const artifactJs = artifact + '.js';
      const artifactPath = `${globals.codeDirectory}/${artifactJs}`;
      return await this.runCode(artifactPath, params);
  }

  private async runCode(codeFilePath: string, params: any) {
    return await require(codeFilePath).code(params);
  }
}
