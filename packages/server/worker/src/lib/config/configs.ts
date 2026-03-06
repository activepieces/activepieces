import { from } from 'env-var'

const env = from(process.env)

export enum WorkerSystemProp {
    API_URL = 'AP_API_URL',
    WORKER_TOKEN = 'AP_WORKER_TOKEN',
    LOG_LEVEL = 'AP_LOG_LEVEL',
    LOG_PRETTY = 'AP_LOG_PRETTY',
    OTEL_ENABLED = 'AP_OTEL_ENABLED',
}

export const system = {
    get(prop: WorkerSystemProp): string | undefined {
        return env.get(prop).asString()
    },
    getOrThrow(prop: WorkerSystemProp): string {
        return env.get(prop).required().asString()
    },
    getBoolean(prop: WorkerSystemProp): boolean | undefined {
        return env.get(prop).asBoolStrict()
    },
}
