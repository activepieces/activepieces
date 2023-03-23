import {globals} from '../../src/globals';
import {CodeExecutor} from '../../src/executors/code-executer';

const rootDir = require('path').resolve('./');

describe('Code Executor', () => {
  beforeAll(() => {
    jest
      .spyOn(globals, 'codeDirectory', 'get')
      .mockReturnValue(`${rootDir}/test/resources/codes`);
    jest
      .spyOn(globals, 'executorFile', 'get')
      .mockReturnValue(`${rootDir}/test/resources/executor.js`);
  });

  test('Artifact is executed and output is returned', async () => {
    const artifactId =
      '9A81EED014C3CAE7A54D1049DDF56EA86B444BA1B20D4A772B5580C6F71F7630';
    const params = {};

    const codeExecutor = new CodeExecutor();

    await expect(codeExecutor.executeCode(artifactId, params)).resolves.toEqual(
      true
    );
  });

  test('Executor throws on invalid file', async () => {
    const artifactId = 'invalid-artifact.zip';
    const params = {};

    const codeExecutor = new CodeExecutor();

    await expect(
      codeExecutor.executeCode(artifactId, params)
    ).rejects.toThrow();
  });

  test('Executor throws on invalid code', async () => {
    const artifactId = 'invalid-code';
    const params = {};

    const codeExecutor = new CodeExecutor();

    expect(codeExecutor.executeCode(artifactId, params)).rejects.toThrow();
  });
});
