import { FlowVersion, FlowVersionState } from '../flow-version'

export class FlowBuilder {
    private flow: FlowVersion

    constructor(flow: FlowVersion) {
        this.flow = JSON.parse(JSON.stringify(flow))
    }

    changeName(displayName: string): FlowBuilder {
        return new FlowBuilder({ ...this.flow, displayName })
    }

    lockFlow(): FlowBuilder {
        return new FlowBuilder({ ...this.flow, state: FlowVersionState.LOCKED })
    }

    build(): FlowVersion {
        return this.flow
    }
}