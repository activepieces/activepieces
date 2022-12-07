class Globals {
  private _collectionDirectory = './collections';
  private _flowDirectory = './flows';
  private _codeDirectory = './codes';
  private _configsFile = './configs.json';
  private _triggerPayloadFile = './triggerPayload.json';
  private _inputFile = './input.json';
  private _outputFile = './output.json';
  private _executorFile = './executor.js';
  private _workerToken = '';
  private _apiUrl = '';

  set apiUrl(_apiUrl: string) {
    this._apiUrl = _apiUrl;
  }

  get apiUrl() {
    return this._apiUrl;
  }

  set workerToken(_workerToken: string) {
    this._workerToken = _workerToken;
  }

  get workerToken() {
    return this._workerToken;
  }

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
