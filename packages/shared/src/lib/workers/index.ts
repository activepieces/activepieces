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

export const MachineInformation = Type.Object({
    cpuUsagePercentage: Type.Number(),
    diskInfo: Type.Object({
        total: Type.Number(),
        free: Type.Number(),
        used: Type.Number(),
        percentage: Type.Number(),
    }),
    workerProps: Type.Record(Type.String(), Type.String()),
    ramUsagePercentage: Type.Number(),
    totalAvailableRamInBytes: Type.Number(),
    ip: Type.String(),
})

export type MachineInformation = Static<typeof MachineInformation>

export const WorkerMachine = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    type: Type.Enum(WorkerMachineType),
    information: MachineInformation,
})

export type WorkerMachine = Static<typeof WorkerMachine>

export const WorkerMachineWithStatus = Type.Composite([WorkerMachine, Type.Object({
    status: Type.Enum(WorkerMachineStatus),
})])

export type WorkerMachineWithStatus = Static<typeof WorkerMachineWithStatus>

export const WorkerMachineHealthcheckRequest = MachineInformation

export type WorkerMachineHealthcheckRequest = Static<typeof WorkerMachineHealthcheckRequest>
