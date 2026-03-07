import { from } from 'env-var'

const env = from(process.env)

export enum WorkerSystemProp {
    API_URL = 'AP_API_URL',
    WORKER_TOKEN = 'AP_WORKER_TOKEN',
    LOG_LEVEL = 'AP_LOG_LEVEL',
    LOG_PRETTY = 'AP_LOG_PRETTY',
    OTEL_ENABLED = 'AP_OTEL_ENABLED',
    LOAD_TRANSLATIONS_FOR_DEV_PIECES = 'AP_LOAD_TRANSLATIONS_FOR_DEV_PIECES',
}

const defaultValues: Partial<Record<WorkerSystemProp, string>> = {
    [WorkerSystemProp.LOG_LEVEL]: 'info',
    [WorkerSystemProp.LOG_PRETTY]: 'false',
    [WorkerSystemProp.OTEL_ENABLED]: 'false',
}

export const system = {
    get(prop: WorkerSystemProp): string | undefined {
        return env.get(prop).asString() ?? defaultValues[prop]
    },
    getOrThrow(prop: WorkerSystemProp): string {
        return env.get(prop).required().asString()
    },
    getBoolean(prop: WorkerSystemProp): boolean | undefined {
        return env.get(prop).asBoolStrict()
    },
}
