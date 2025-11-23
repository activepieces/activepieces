import { Dayjs } from "dayjs"
import * as Regular from "./regular-jobs"
import * as Durable from "./durable-jobs"

export type SystemJobName = Regular.SystemJobName | Durable.DurableSystemJobName

type SystemJobDataMap = {
  [K in Regular.SystemJobName]: Regular.SystemJobDataMap[K]
} & {
  [K in Durable.DurableSystemJobName]: Durable.DurableSystemJobDataMap[K]
}

export type SystemJobData<T extends SystemJobName = SystemJobName> = SystemJobDataMap[T]

export type SystemJobDefinition<T extends SystemJobName> = {
    name: T
    data: SystemJobData<T>
    jobId?: string
}

export type SystemJobHandler<T extends SystemJobName = SystemJobName> = (data: SystemJobData<T>) => Promise<void>

type OneTimeJobSchedule = {
    type: 'one-time'
    date: Dayjs
}

type RepeatedJobSchedule = {
    type: 'repeated'
    cron: string
}

export type JobSchedule = OneTimeJobSchedule | RepeatedJobSchedule

type UpsertJobParams<T extends SystemJobName> = {
    job: SystemJobDefinition<T>
    schedule: JobSchedule
}

export type SystemJobSchedule = {
    init(): Promise<void>
    upsertJob<T extends SystemJobName>(params: UpsertJobParams<T>): Promise<void>
    close(): Promise<void>
}
