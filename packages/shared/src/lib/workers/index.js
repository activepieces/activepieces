"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerSettingsResponse = exports.WorkerMachineHealthcheckRequest = exports.ConsumeJobResponse = exports.ConsumeJobResponseStatus = exports.ConsumeJobRequest = exports.WorkerMachineWithStatus = exports.WorkerMachine = exports.MachineInformation = exports.WorkerMachineStatus = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const job_data_1 = require("./job-data");
var WorkerMachineStatus;
(function (WorkerMachineStatus) {
    WorkerMachineStatus["ONLINE"] = "ONLINE";
    WorkerMachineStatus["OFFLINE"] = "OFFLINE";
})(WorkerMachineStatus || (exports.WorkerMachineStatus = WorkerMachineStatus = {}));
exports.MachineInformation = typebox_1.Type.Object({
    cpuUsagePercentage: typebox_1.Type.Number(),
    diskInfo: typebox_1.Type.Object({
        total: typebox_1.Type.Number(),
        free: typebox_1.Type.Number(),
        used: typebox_1.Type.Number(),
        percentage: typebox_1.Type.Number(),
    }),
    workerId: typebox_1.Type.String(),
    workerProps: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String()),
    ramUsagePercentage: typebox_1.Type.Number(),
    totalAvailableRamInBytes: typebox_1.Type.Number(),
    totalCpuCores: typebox_1.Type.Number(),
    ip: typebox_1.Type.String(),
    totalSandboxes: typebox_1.Type.Number(),
    freeSandboxes: typebox_1.Type.Number(),
});
exports.WorkerMachine = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { information: exports.MachineInformation }));
exports.WorkerMachineWithStatus = typebox_1.Type.Composite([exports.WorkerMachine, typebox_1.Type.Object({
        status: typebox_1.Type.Enum(WorkerMachineStatus),
    })]);
exports.ConsumeJobRequest = typebox_1.Type.Object({
    jobId: typebox_1.Type.String(),
    jobData: job_data_1.JobData,
    timeoutInSeconds: typebox_1.Type.Number(),
    attempsStarted: typebox_1.Type.Number(),
    engineToken: typebox_1.Type.String(),
});
var ConsumeJobResponseStatus;
(function (ConsumeJobResponseStatus) {
    ConsumeJobResponseStatus["OK"] = "OK";
    ConsumeJobResponseStatus["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ConsumeJobResponseStatus || (exports.ConsumeJobResponseStatus = ConsumeJobResponseStatus = {}));
exports.ConsumeJobResponse = typebox_1.Type.Object({
    status: typebox_1.Type.Enum(ConsumeJobResponseStatus),
    errorMessage: typebox_1.Type.Optional(typebox_1.Type.String()),
    delayInSeconds: typebox_1.Type.Optional(typebox_1.Type.Number()),
});
exports.WorkerMachineHealthcheckRequest = exports.MachineInformation;
exports.WorkerSettingsResponse = typebox_1.Type.Object({
    PUBLIC_URL: typebox_1.Type.String(),
    TRIGGER_TIMEOUT_SECONDS: typebox_1.Type.Number(),
    TRIGGER_HOOKS_TIMEOUT_SECONDS: typebox_1.Type.Number(),
    PAUSED_FLOW_TIMEOUT_DAYS: typebox_1.Type.Number(),
    EXECUTION_MODE: typebox_1.Type.String(),
    FLOW_TIMEOUT_SECONDS: typebox_1.Type.Number(),
    WORKER_CONCURRENCY: typebox_1.Type.Number(),
    LOG_LEVEL: typebox_1.Type.String(),
    LOG_PRETTY: typebox_1.Type.String(),
    ENVIRONMENT: typebox_1.Type.String(),
    APP_WEBHOOK_SECRETS: typebox_1.Type.String(),
    MAX_FILE_SIZE_MB: typebox_1.Type.Number(),
    SANDBOX_MEMORY_LIMIT: typebox_1.Type.String(),
    SANDBOX_PROPAGATED_ENV_VARS: typebox_1.Type.Array(typebox_1.Type.String()),
    DEV_PIECES: typebox_1.Type.Array(typebox_1.Type.String()),
    SENTRY_DSN: typebox_1.Type.Optional(typebox_1.Type.String()),
    LOKI_PASSWORD: typebox_1.Type.Optional(typebox_1.Type.String()),
    LOKI_URL: typebox_1.Type.Optional(typebox_1.Type.String()),
    LOKI_USERNAME: typebox_1.Type.Optional(typebox_1.Type.String()),
    OTEL_ENABLED: typebox_1.Type.Boolean(),
    HYPERDX_TOKEN: typebox_1.Type.Optional(typebox_1.Type.String()),
    FILE_STORAGE_LOCATION: typebox_1.Type.String(),
    S3_USE_SIGNED_URLS: typebox_1.Type.String(),
    QUEUE_MODE: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_TYPE: typebox_1.Type.String(),
    REDIS_SSL_CA_FILE: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_DB: typebox_1.Type.Optional(typebox_1.Type.Number()),
    REDIS_HOST: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_PASSWORD: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_PORT: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_URL: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_USER: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_USE_SSL: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    REDIS_SENTINEL_ROLE: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_SENTINEL_HOSTS: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_SENTINEL_NAME: typebox_1.Type.Optional(typebox_1.Type.String()),
    REDIS_FAILED_JOB_RETENTION_DAYS: typebox_1.Type.Number(),
    REDIS_FAILED_JOB_RETENTION_MAX_COUNT: typebox_1.Type.Number(),
    PROJECT_RATE_LIMITER_ENABLED: typebox_1.Type.Boolean(),
    MAX_CONCURRENT_JOBS_PER_PROJECT: typebox_1.Type.Number(),
    JWT_SECRET: typebox_1.Type.String(),
    PLATFORM_ID_FOR_DEDICATED_WORKER: typebox_1.Type.Optional(typebox_1.Type.String()),
    EDITION: typebox_1.Type.String(),
});
//# sourceMappingURL=index.js.map