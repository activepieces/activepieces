class Globals {
  private _collectionDirectory = './collections';
  private _flowDirectory = './flows';
  private _codeDirectory = './codes';
  private _configsFile = './configs.json';
  private _triggerPayloadFile = './triggerPayload.json';
  private _inputFile = './input.json';
  private _outputFile = './output.json';
  private _executorFile = './executor.js';

  get collectionDirectory() {
    return this._collectionDirectory;
  }

  get flowDirectory() {
    return this._flowDirectory;
  }

  get codeDirectory() {
    return this._codeDirectory;
  }

  get configsFile() {
    return this._configsFile;
  }

  get triggerPayloadFile() {
    return this._triggerPayloadFile;
  }

  get inputFile() {
    return this._inputFile;
  }

  get outputFile() {
    return this._outputFile;
  }

  get executorFile() {
    return this._executorFile;
  }
}

export const globals = new Globals();
