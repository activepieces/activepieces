import { Static, Type } from '@sinclair/typebox'
import { ProjectState } from '../project-release/project-state'
import { PopulatedFlow } from '../flows'
import { AppConnectionWithoutSensitiveData } from '../app-connection/app-connection'
import { PopulatedAgent } from '../agents'
import { Table } from '../tables'


export const Solution = Type.Object({
    name: Type.String(),
    description: Type.String(),
    state: ProjectState,
    thumbnail: Type.Optional(Type.String()),
    author: Type.Optional(Type.String()),
})

export type Solution = Static<typeof Solution>

export const ExportSolutionRequestBody = Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
})

export type ExportSolutionRequestBody = Static<typeof ExportSolutionRequestBody>


export const ImportSolutionRequestBody = Type.Object({
    solution: Solution,
    connectionsMap: Type.Record(Type.String(), Type.String()),
})

export type ImportSolutionRequestBody = Static<typeof ImportSolutionRequestBody>

export const ImportSolutionResponse = Type.Object({
    flows: Type.Array(PopulatedFlow),
    connections: Type.Array(AppConnectionWithoutSensitiveData),
    agents: Type.Array(PopulatedAgent),
    tables: Type.Array(Table),
})

export type ImportSolutionResponse = Static<typeof ImportSolutionResponse>