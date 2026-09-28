import { isObject } from '@activepieces/core-utils'
import { ApplicationEvent } from '@activepieces/shared'
import { OTLPLogRecord, toOTLPLogRecord } from 'evlog/otlp'
import { Root } from 'protobufjs'

const SERVICE_NAME = 'activepieces'

const SCOPE_NAME = 'activepieces.event-streaming'

const KEY_VALUE = {
    fields: {
        key: { type: 'string', id: 1 },
        value: { type: 'AnyValue', id: 2 },
    },
}

const OTLP_LOGS_DESCRIPTOR = {
    nested: {
        otlp: {
            nested: {
                AnyValue: {
                    oneofs: {
                        value: {
                            oneof: ['stringValue', 'boolValue', 'intValue', 'doubleValue', 'arrayValue', 'kvlistValue', 'bytesValue'],
                        },
                    },
                    fields: {
                        stringValue: { type: 'string', id: 1 },
                        boolValue: { type: 'bool', id: 2 },
                        intValue: { type: 'int64', id: 3 },
                        doubleValue: { type: 'double', id: 4 },
                        arrayValue: { type: 'ArrayValue', id: 5 },
                        kvlistValue: { type: 'KeyValueList', id: 6 },
                        bytesValue: { type: 'bytes', id: 7 },
                    },
                },
                ArrayValue: {
                    fields: {
                        values: { rule: 'repeated', type: 'AnyValue', id: 1 },
                    },
                },
                KeyValueList: {
                    fields: {
                        values: { rule: 'repeated', type: 'KeyValue', id: 1 },
                    },
                },
                KeyValue: KEY_VALUE,
                Resource: {
                    fields: {
                        attributes: { rule: 'repeated', type: 'KeyValue', id: 1 },
                        droppedAttributesCount: { type: 'uint32', id: 2 },
                    },
                },
                InstrumentationScope: {
                    fields: {
                        name: { type: 'string', id: 1 },
                        version: { type: 'string', id: 2 },
                        attributes: { rule: 'repeated', type: 'KeyValue', id: 3 },
                        droppedAttributesCount: { type: 'uint32', id: 4 },
                    },
                },
                LogRecord: {
                    fields: {
                        timeUnixNano: { type: 'fixed64', id: 1 },
                        severityNumber: { type: 'int32', id: 2 },
                        severityText: { type: 'string', id: 3 },
                        body: { type: 'AnyValue', id: 5 },
                        attributes: { rule: 'repeated', type: 'KeyValue', id: 6 },
                        droppedAttributesCount: { type: 'uint32', id: 7 },
                        flags: { type: 'fixed32', id: 8 },
                        traceId: { type: 'bytes', id: 9 },
                        spanId: { type: 'bytes', id: 10 },
                        observedTimeUnixNano: { type: 'fixed64', id: 11 },
                        eventName: { type: 'string', id: 12 },
                    },
                },
                ScopeLogs: {
                    fields: {
                        scope: { type: 'InstrumentationScope', id: 1 },
                        logRecords: { rule: 'repeated', type: 'LogRecord', id: 2 },
                        schemaUrl: { type: 'string', id: 3 },
                    },
                },
                ResourceLogs: {
                    fields: {
                        resource: { type: 'Resource', id: 1 },
                        scopeLogs: { rule: 'repeated', type: 'ScopeLogs', id: 2 },
                        schemaUrl: { type: 'string', id: 3 },
                    },
                },
                ExportLogsServiceRequest: {
                    fields: {
                        resourceLogs: { rule: 'repeated', type: 'ResourceLogs', id: 1 },
                    },
                },
            },
        },
    },
}

const exportLogsServiceRequest = Root.fromJSON(OTLP_LOGS_DESCRIPTOR).lookupType('otlp.ExportLogsServiceRequest')

function buildExportRequest({ event, environment }: BuildExportRequestParams): OtlpExportLogsRequest {
    const { created, data, action, id, platformId, projectId, projectDisplayName, userId, userEmail, ip } = event
    const record = toOTLPLogRecord({
        timestamp: created,
        level: 'info',
        service: SERVICE_NAME,
        environment,
        action,
        id,
        platformId,
        projectId,
        projectDisplayName,
        userId,
        userEmail,
        ip,
        ...Object.fromEntries(flattenAttributes({ prefix: 'data', value: data })),
    })
    return {
        resourceLogs: [{
            resource: {
                attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }],
            },
            scopeLogs: [{
                scope: { name: SCOPE_NAME },
                logRecords: [{
                    ...record,
                    body: { stringValue: JSON.stringify(event) },
                    eventName: action,
                }],
            }],
        }],
    }
}

function encodeExportRequest(request: Record<string, unknown>): Uint8Array {
    return exportLogsServiceRequest.encode(exportLogsServiceRequest.fromObject(request)).finish()
}

export const otlpLogs = {
    buildExportRequest,
    encodeExportRequest,
}

function flattenAttributes({ prefix, value }: FlattenAttributesParams): [string, unknown][] {
    if (value instanceof Date) {
        return [[prefix, value.toISOString()]]
    }
    if (isObject(value)) {
        return Object.entries(value).flatMap(([key, child]) => flattenAttributes({ prefix: `${prefix}.${key}`, value: child }))
    }
    return [[prefix, value]]
}

type BuildExportRequestParams = {
    event: ApplicationEvent
    environment: string
}

type FlattenAttributesParams = {
    prefix: string
    value: unknown
}

export type OtlpLogRecord = OTLPLogRecord & {
    eventName: string
}

export type OtlpExportLogsRequest = {
    resourceLogs: {
        resource: {
            attributes: OTLPLogRecord['attributes']
        }
        scopeLogs: {
            scope: { name: string }
            logRecords: OtlpLogRecord[]
        }[]
    }[]
}
