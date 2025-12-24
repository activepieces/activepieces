import { Static } from '@sinclair/typebox';
export declare enum WorkerMachineStatus {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE"
}
export declare const MachineInformation: import("@sinclair/typebox").TObject<{
    cpuUsagePercentage: import("@sinclair/typebox").TNumber;
    diskInfo: import("@sinclair/typebox").TObject<{
        total: import("@sinclair/typebox").TNumber;
        free: import("@sinclair/typebox").TNumber;
        used: import("@sinclair/typebox").TNumber;
        percentage: import("@sinclair/typebox").TNumber;
    }>;
    workerId: import("@sinclair/typebox").TString;
    workerProps: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    ramUsagePercentage: import("@sinclair/typebox").TNumber;
    totalAvailableRamInBytes: import("@sinclair/typebox").TNumber;
    totalCpuCores: import("@sinclair/typebox").TNumber;
    ip: import("@sinclair/typebox").TString;
    totalSandboxes: import("@sinclair/typebox").TNumber;
    freeSandboxes: import("@sinclair/typebox").TNumber;
}>;
export type MachineInformation = Static<typeof MachineInformation>;
export declare const WorkerMachine: import("@sinclair/typebox").TObject<{
    information: import("@sinclair/typebox").TObject<{
        cpuUsagePercentage: import("@sinclair/typebox").TNumber;
        diskInfo: import("@sinclair/typebox").TObject<{
            total: import("@sinclair/typebox").TNumber;
            free: import("@sinclair/typebox").TNumber;
            used: import("@sinclair/typebox").TNumber;
            percentage: import("@sinclair/typebox").TNumber;
        }>;
        workerId: import("@sinclair/typebox").TString;
        workerProps: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        ramUsagePercentage: import("@sinclair/typebox").TNumber;
        totalAvailableRamInBytes: import("@sinclair/typebox").TNumber;
        totalCpuCores: import("@sinclair/typebox").TNumber;
        ip: import("@sinclair/typebox").TString;
        totalSandboxes: import("@sinclair/typebox").TNumber;
        freeSandboxes: import("@sinclair/typebox").TNumber;
    }>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type WorkerMachine = Static<typeof WorkerMachine>;
export declare const WorkerMachineWithStatus: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    information: import("@sinclair/typebox").TObject<{
        cpuUsagePercentage: import("@sinclair/typebox").TNumber;
        diskInfo: import("@sinclair/typebox").TObject<{
            total: import("@sinclair/typebox").TNumber;
            free: import("@sinclair/typebox").TNumber;
            used: import("@sinclair/typebox").TNumber;
            percentage: import("@sinclair/typebox").TNumber;
        }>;
        workerId: import("@sinclair/typebox").TString;
        workerProps: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        ramUsagePercentage: import("@sinclair/typebox").TNumber;
        totalAvailableRamInBytes: import("@sinclair/typebox").TNumber;
        totalCpuCores: import("@sinclair/typebox").TNumber;
        ip: import("@sinclair/typebox").TString;
        totalSandboxes: import("@sinclair/typebox").TNumber;
        freeSandboxes: import("@sinclair/typebox").TNumber;
    }>;
    status: import("@sinclair/typebox").TEnum<typeof WorkerMachineStatus>;
}>;
export type WorkerMachineWithStatus = Static<typeof WorkerMachineWithStatus>;
export declare const ConsumeJobRequest: import("@sinclair/typebox").TObject<{
    jobId: import("@sinclair/typebox").TString;
    jobData: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        projectId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
        schemaVersion: import("@sinclair/typebox").TNumber;
        flowVersionId: import("@sinclair/typebox").TString;
        flowId: import("@sinclair/typebox").TString;
        triggerType: import("@sinclair/typebox").TEnum<typeof import("../..").FlowTriggerType>;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.EXECUTE_POLLING>;
    }>, import("@sinclair/typebox").TObject<{
        schemaVersion: import("@sinclair/typebox").TNumber;
        projectId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
        flowVersionId: import("@sinclair/typebox").TString;
        flowId: import("@sinclair/typebox").TString;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.RENEW_WEBHOOK>;
    }>, import("@sinclair/typebox").TObject<{
        projectId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.EXECUTE_FLOW>;
        environment: import("@sinclair/typebox").TEnum<typeof import("../..").RunEnvironment>;
        schemaVersion: import("@sinclair/typebox").TNumber;
        flowId: import("@sinclair/typebox").TString;
        flowVersionId: import("@sinclair/typebox").TString;
        runId: import("@sinclair/typebox").TString;
        synchronousHandlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        httpRequestId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        payload: import("@sinclair/typebox").TAny;
        executeTrigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        executionType: import("@sinclair/typebox").TEnum<typeof import("../..").ExecutionType>;
        progressUpdateType: import("@sinclair/typebox").TEnum<typeof import("../engine").ProgressUpdateType>;
        stepNameToTest: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        logsUploadUrl: import("@sinclair/typebox").TString;
        logsFileId: import("@sinclair/typebox").TString;
        traceContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>, import("@sinclair/typebox").TObject<{
        projectId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
        schemaVersion: import("@sinclair/typebox").TNumber;
        requestId: import("@sinclair/typebox").TString;
        payload: import("@sinclair/typebox").TAny;
        runEnvironment: import("@sinclair/typebox").TEnum<typeof import("../..").RunEnvironment>;
        flowId: import("@sinclair/typebox").TString;
        saveSampleData: import("@sinclair/typebox").TBoolean;
        flowVersionIdToRun: import("@sinclair/typebox").TString;
        execute: import("@sinclair/typebox").TBoolean;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.EXECUTE_WEBHOOK>;
        parentRunId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        failParentOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        traceContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        requestId: import("@sinclair/typebox").TString;
        webserverId: import("@sinclair/typebox").TString;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.EXECUTE_VALIDATION>;
        projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        platformId: import("@sinclair/typebox").TString;
        piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.ARCHIVE>;
            pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces").PieceType>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            archiveId: import("@sinclair/typebox").TString;
            platformId: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.REGISTRY>;
            pieceType: import("@sinclair/typebox").TLiteral<import("../pieces").PieceType.OFFICIAL>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.REGISTRY>;
            pieceType: import("@sinclair/typebox").TLiteral<import("../pieces").PieceType.CUSTOM>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            platformId: import("@sinclair/typebox").TString;
        }>]>;
        schemaVersion: import("@sinclair/typebox").TNumber;
        connectionValue: import("@sinclair/typebox").TUnknown;
    }>, import("@sinclair/typebox").TObject<{
        requestId: import("@sinclair/typebox").TString;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.EXECUTE_TRIGGER_HOOK>;
        platformId: import("@sinclair/typebox").TString;
        projectId: import("@sinclair/typebox").TString;
        schemaVersion: import("@sinclair/typebox").TNumber;
        flowId: import("@sinclair/typebox").TString;
        flowVersionId: import("@sinclair/typebox").TString;
        test: import("@sinclair/typebox").TBoolean;
        webserverId: import("@sinclair/typebox").TString;
        hookType: import("@sinclair/typebox").TEnum<typeof import("../engine").TriggerHookType>;
        triggerPayload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            body: import("@sinclair/typebox").TUnknown;
            rawBody: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
            headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
            queryParams: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
        }>>;
    }>, import("@sinclair/typebox").TObject<{
        requestId: import("@sinclair/typebox").TString;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.EXECUTE_PROPERTY>;
        projectId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
        schemaVersion: import("@sinclair/typebox").TNumber;
        flowVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            flowId: import("@sinclair/typebox").TString;
            displayName: import("@sinclair/typebox").TString;
            trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.PIECE>;
                settings: import("@sinclair/typebox").TObject<{
                    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                        lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    }>>;
                    propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                        type: import("@sinclair/typebox").TEnum<typeof import("../flows").PropertyExecutionType>;
                        schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
                    }>>;
                    customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    pieceName: import("@sinclair/typebox").TString;
                    pieceVersion: import("@sinclair/typebox").TString;
                    triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
                }>;
                name: import("@sinclair/typebox").TString;
                valid: import("@sinclair/typebox").TBoolean;
                displayName: import("@sinclair/typebox").TString;
                nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>, import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.EMPTY>;
                settings: import("@sinclair/typebox").TAny;
                name: import("@sinclair/typebox").TString;
                valid: import("@sinclair/typebox").TBoolean;
                displayName: import("@sinclair/typebox").TString;
                nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>]>;
            updatedBy: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
            valid: import("@sinclair/typebox").TBoolean;
            schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
            agentIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
            state: import("@sinclair/typebox").TEnum<typeof import("../..").FlowVersionState>;
            connectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
            backupFiles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
                [x: string]: string;
            }>>;
            id: import("@sinclair/typebox").TString;
            created: import("@sinclair/typebox").TString;
            updated: import("@sinclair/typebox").TString;
        }>>;
        propertyName: import("@sinclair/typebox").TString;
        piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.ARCHIVE>;
            pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces").PieceType>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            archiveId: import("@sinclair/typebox").TString;
            platformId: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.REGISTRY>;
            pieceType: import("@sinclair/typebox").TLiteral<import("../pieces").PieceType.OFFICIAL>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.REGISTRY>;
            pieceType: import("@sinclair/typebox").TLiteral<import("../pieces").PieceType.CUSTOM>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            platformId: import("@sinclair/typebox").TString;
        }>]>;
        actionOrTriggerName: import("@sinclair/typebox").TString;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
        webserverId: import("@sinclair/typebox").TString;
        sampleData: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
        searchValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, import("@sinclair/typebox").TObject<{
        requestId: import("@sinclair/typebox").TString;
        webserverId: import("@sinclair/typebox").TString;
        schemaVersion: import("@sinclair/typebox").TNumber;
        jobType: import("@sinclair/typebox").TLiteral<import("./job-data").WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION>;
        projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        platformId: import("@sinclair/typebox").TString;
        piece: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.ARCHIVE>;
            pieceType: import("@sinclair/typebox").TEnum<typeof import("../pieces").PieceType>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            archiveId: import("@sinclair/typebox").TString;
            platformId: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.REGISTRY>;
            pieceType: import("@sinclair/typebox").TLiteral<import("../pieces").PieceType.OFFICIAL>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            packageType: import("@sinclair/typebox").TLiteral<import("../pieces").PackageType.REGISTRY>;
            pieceType: import("@sinclair/typebox").TLiteral<import("../pieces").PieceType.CUSTOM>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            platformId: import("@sinclair/typebox").TString;
        }>]>;
    }>]>]>;
    timeoutInSeconds: import("@sinclair/typebox").TNumber;
    attempsStarted: import("@sinclair/typebox").TNumber;
    engineToken: import("@sinclair/typebox").TString;
}>;
export declare enum ConsumeJobResponseStatus {
    OK = "OK",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
export type ConsumeJobRequest = Static<typeof ConsumeJobRequest>;
export declare const ConsumeJobResponse: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TEnum<typeof ConsumeJobResponseStatus>;
    errorMessage: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    delayInSeconds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type ConsumeJobResponse = Static<typeof ConsumeJobResponse>;
export declare const WorkerMachineHealthcheckRequest: import("@sinclair/typebox").TObject<{
    cpuUsagePercentage: import("@sinclair/typebox").TNumber;
    diskInfo: import("@sinclair/typebox").TObject<{
        total: import("@sinclair/typebox").TNumber;
        free: import("@sinclair/typebox").TNumber;
        used: import("@sinclair/typebox").TNumber;
        percentage: import("@sinclair/typebox").TNumber;
    }>;
    workerId: import("@sinclair/typebox").TString;
    workerProps: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    ramUsagePercentage: import("@sinclair/typebox").TNumber;
    totalAvailableRamInBytes: import("@sinclair/typebox").TNumber;
    totalCpuCores: import("@sinclair/typebox").TNumber;
    ip: import("@sinclair/typebox").TString;
    totalSandboxes: import("@sinclair/typebox").TNumber;
    freeSandboxes: import("@sinclair/typebox").TNumber;
}>;
export type WorkerMachineHealthcheckRequest = Static<typeof WorkerMachineHealthcheckRequest>;
export declare const WorkerSettingsResponse: import("@sinclair/typebox").TObject<{
    PUBLIC_URL: import("@sinclair/typebox").TString;
    TRIGGER_TIMEOUT_SECONDS: import("@sinclair/typebox").TNumber;
    TRIGGER_HOOKS_TIMEOUT_SECONDS: import("@sinclair/typebox").TNumber;
    PAUSED_FLOW_TIMEOUT_DAYS: import("@sinclair/typebox").TNumber;
    EXECUTION_MODE: import("@sinclair/typebox").TString;
    FLOW_TIMEOUT_SECONDS: import("@sinclair/typebox").TNumber;
    WORKER_CONCURRENCY: import("@sinclair/typebox").TNumber;
    LOG_LEVEL: import("@sinclair/typebox").TString;
    LOG_PRETTY: import("@sinclair/typebox").TString;
    ENVIRONMENT: import("@sinclair/typebox").TString;
    APP_WEBHOOK_SECRETS: import("@sinclair/typebox").TString;
    MAX_FILE_SIZE_MB: import("@sinclair/typebox").TNumber;
    SANDBOX_MEMORY_LIMIT: import("@sinclair/typebox").TString;
    SANDBOX_PROPAGATED_ENV_VARS: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    DEV_PIECES: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    SENTRY_DSN: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    LOKI_PASSWORD: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    LOKI_URL: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    LOKI_USERNAME: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    OTEL_ENABLED: import("@sinclair/typebox").TBoolean;
    HYPERDX_TOKEN: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    FILE_STORAGE_LOCATION: import("@sinclair/typebox").TString;
    S3_USE_SIGNED_URLS: import("@sinclair/typebox").TString;
    QUEUE_MODE: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_TYPE: import("@sinclair/typebox").TString;
    REDIS_SSL_CA_FILE: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_DB: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    REDIS_HOST: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_PASSWORD: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_PORT: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_URL: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_USER: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_USE_SSL: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    REDIS_SENTINEL_ROLE: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_SENTINEL_HOSTS: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_SENTINEL_NAME: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    REDIS_FAILED_JOB_RETENTION_DAYS: import("@sinclair/typebox").TNumber;
    REDIS_FAILED_JOB_RETENTION_MAX_COUNT: import("@sinclair/typebox").TNumber;
    PROJECT_RATE_LIMITER_ENABLED: import("@sinclair/typebox").TBoolean;
    MAX_CONCURRENT_JOBS_PER_PROJECT: import("@sinclair/typebox").TNumber;
    JWT_SECRET: import("@sinclair/typebox").TString;
    PLATFORM_ID_FOR_DEDICATED_WORKER: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    EDITION: import("@sinclair/typebox").TString;
}>;
export type WorkerSettingsResponse = Static<typeof WorkerSettingsResponse>;
