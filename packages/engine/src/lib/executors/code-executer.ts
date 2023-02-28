import { globals } from '../globals';

type CodePieceModule = {
  code(params: unknown): Promise<unknown>;
}

export class CodeExecutor {
  public async executeCode(artifact: string, params: unknown) {
      const artifactJs = `${artifact}.js`;
      const artifactPath = `${globals.codeDirectory}/${artifactJs}`;
      return await this.runCode(artifactPath, params);
  }

  private async runCode(codeFilePath: string, params: unknown) {
    const codePieceModule: CodePieceModule = await import(codeFilePath);
    return await codePieceModule.code(params);
  }
}
