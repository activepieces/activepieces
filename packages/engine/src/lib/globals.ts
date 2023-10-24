import { FlowRunId } from '@activepieces/shared'

class Globals {
    private _inputFile = './input.json'
    private _outputFile = './output.json'
    private _workerToken = ''
    private _projectId = ''
    private _serverUrl = ''
    private _flowRunId?: FlowRunId
    private _resumePayload: unknown
    private _apiUrl = 'http://127.0.0.1:3000/'

    get apiUrl(): string | undefined {
        return this._apiUrl
    }

    set serverUrl(_serverUrl: string) {
        this._serverUrl = _serverUrl
    }

    get serverUrl(): string | undefined {
        return this._serverUrl
    }

    set flowRunId(_flowRunId: string) {
        this._flowRunId = _flowRunId
    }

    get flowRunId(): string | undefined {
        return this._flowRunId
    }

    set resumePayload(_resumePayload: unknown) {
        this._resumePayload = _resumePayload
    }

    get resumePayload() {
        return this._resumePayload
    }

    set projectId(_projectId: string) {
        this._projectId = _projectId
    }

    get projectId() {
        return this._projectId
    }


    set workerToken(_workerToken: string) {
        this._workerToken = _workerToken
    }

    get workerToken() {
        return this._workerToken
    }

    get inputFile() {
        return this._inputFile
    }

    get outputFile() {
        return this._outputFile
    }
}

export const globals = new Globals()
