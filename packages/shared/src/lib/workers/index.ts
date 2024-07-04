import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'

export enum WorkerMachineStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}

export enum WorkerMachineType {
    DEDICATED = 'DEDICATED',
    SHARED = 'SHARED',
}

export const WorkerMachine = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    type: Type.Enum(WorkerMachineType),
    cpuUsage: Type.Number(),
    ramUsage: Type.Number(),
    totalRamInBytes: Type.Number(),
})

export type WorkerMachine = Static<typeof WorkerMachine>

export const WorkerMachineWithStatus = Type.Composite([WorkerMachine, Type.Object({
    status: Type.Enum(WorkerMachineStatus),
})])

export type WorkerMachineWithStatus = Static<typeof WorkerMachineWithStatus>

export const WorkerMachineHealthcheckRequest = Type.Object({
    ramInBytes: Type.Number(),
    cpuUsage: Type.Number(),
    ramUsage: Type.Number(),
    totalRamInBytes: Type.Number(),
})

export type WorkerMachineHealthcheckRequest = Static<typeof WorkerMachineHealthcheckRequest>