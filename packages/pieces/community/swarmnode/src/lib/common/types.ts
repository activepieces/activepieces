type Agent = {
    id:string,
    name:string
}

export type ListAgentResponse = {
    results:Array<Agent>
}

export type Execution = {
    id:string,
    agent_id:string,
    status:'success'|'in_progress'|'failure'|'termination',
}

export type ListExecutionResponse = {
    results:Array<Execution>
}