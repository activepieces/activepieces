class Globals {
  private _collectionDirectory = './collections';
  private _flowDirectory = './flows';
  private _codeDirectory = './codes';
  private _inputFile = './input.json';
  private _outputFile = './output.json';
  private _executorFile = './executor.js';
  private _workerToken = '';
  private _projectId = '';
  private _apiUrl = '';
  private _flowId = '';

  set flowId(_flowId: string) {
    this._flowId = _flowId;
  }

  get flowId() {
    return this._flowId;
  }


  set apiUrl(_apiUrl: string) {
    this._apiUrl = _apiUrl;
  }

  get apiUrl() {
    return this._apiUrl;
  }

  set projectId(_projectId: string) {
    this._projectId = _projectId;
  }

  get projectId() {
    return this._projectId;
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
