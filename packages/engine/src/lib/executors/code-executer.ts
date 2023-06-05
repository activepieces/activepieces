import { globals } from '../globals';

type CodePieceModule = {
  code(params: unknown): Promise<unknown>;
}

export const codeExecutor = {
   async executeCode(artifact: string, params: unknown) {
      const artifactJs = `${artifact}.js`;
      const artifactPath = `${globals.codeDirectory}/${artifactJs}`;
      const codePieceModule: CodePieceModule = await import(artifactPath);
      return codePieceModule.code(params);
  }
}
