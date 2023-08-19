import { FlowRunId, FlowVersionId } from "@activepieces/shared";

class Globals {
  private _codeDirectory = './codes';
  private _inputFile = './input.json';
  private _outputFile = './output.json';
  private _workerToken = '';
  private _projectId = '';
  private _apiUrl = '';
  private _serverUrl = '';
  private _flowVersionId = '';
  private _flowRunId?: FlowRunId
  private _resumePayload: unknown

  set serverUrl(_serverUrl: string) {
    this._serverUrl = _serverUrl;
  }

  get serverUrl(): string | undefined {
    return this._serverUrl;
  }

  set flowRunId(_flowRunId: string) {
    this._flowRunId = _flowRunId;
  }

  get flowRunId(): string | undefined {
    return this._flowRunId;
  }

  set resumePayload(_resumePayload: unknown) {
    this._resumePayload = _resumePayload;
  }

  get resumePayload() {
    return this._resumePayload;
  }

  set flowVersionId(_flowVersionId: FlowVersionId) {
    this._flowVersionId = _flowVersionId;
  }

  get flowVersionId(): FlowVersionId {
    return this._flowVersionId;
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

  get codeDirectory() {
    return this._codeDirectory;
  }

  get inputFile() {
    return this._inputFile;
  }

  get outputFile() {
    return this._outputFile;
  }
}

export const globals = new Globals();
