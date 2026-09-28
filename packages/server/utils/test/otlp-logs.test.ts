import { ApplicationEventName, buildMockEvent, ConnectionEvent, FlowRunEvent } from '@activepieces/shared'
import { Root } from 'protobufjs'
import { describe, expect, it } from 'vitest'
import { otlpLogs } from '../src/otlp-logs'

const flowRunFinished: FlowRunEvent = {
    id: 'Qz3vN8kLp2XwR7tY1mB4c',
    created: '2026-09-23T10:15:42.318Z',
    updated: '2026-09-23T10:15:42.318Z',
    platformId: 'Hd8sK2mWq9LxT4vB7nP1e',
    projectId: 'Rt6yU1oPa3SdF5gH8jK2l',
    projectDisplayName: 'Finance Ops',
    action: ApplicationEventName.FLOW_RUN_FINISHED,
    data: {
        flowRun: {
            id: 'Mn2bV5cX8zL1kJ4hG7fD0',
            startTime: '2026-09-23T10:15:37.087Z',
            finishTime: '2026-09-23T10:15:42.301Z',
            duration: 5214,
            environment: 'PRODUCTION',
            flowId: 'Wq4eR7tY0uI3oP6aS9dF2',
            flowVersionId: 'Zx1cV4bN7mL0kJ3hG6fD9',
            flowDisplayName: 'Invoice sync',
            status: 'FAILED',
        },
        project: { displayName: 'Finance Ops' },
    },
}

describe('otlpLogs.buildExportRequest', () => {
    it('pins the OTLP logs request shape for a flow run event', () => {
        const request = otlpLogs.buildExportRequest({ event: flowRunFinished, environment: 'prod' })

        expect(request).toEqual({
            resourceLogs: [{
                resource: { attributes: [{ key: 'service.name', value: { stringValue: 'activepieces' } }] },
                scopeLogs: [{
                    scope: { name: 'activepieces.event-streaming' },
                    logRecords: [{
                        timeUnixNano: '1790158542318000000',
                        severityNumber: 9,
                        severityText: 'INFO',
                        eventName: 'flow.run.finished',
                        body: { stringValue: JSON.stringify(flowRunFinished) },
                        attributes: [
                            { key: 'action', value: { stringValue: 'flow.run.finished' } },
                            { key: 'id', value: { stringValue: 'Qz3vN8kLp2XwR7tY1mB4c' } },
                            { key: 'platformId', value: { stringValue: 'Hd8sK2mWq9LxT4vB7nP1e' } },
                            { key: 'projectId', value: { stringValue: 'Rt6yU1oPa3SdF5gH8jK2l' } },
                            { key: 'projectDisplayName', value: { stringValue: 'Finance Ops' } },
                            { key: 'data.flowRun.id', value: { stringValue: 'Mn2bV5cX8zL1kJ4hG7fD0' } },
                            { key: 'data.flowRun.startTime', value: { stringValue: '2026-09-23T10:15:37.087Z' } },
                            { key: 'data.flowRun.finishTime', value: { stringValue: '2026-09-23T10:15:42.301Z' } },
                            { key: 'data.flowRun.duration', value: { intValue: '5214' } },
                            { key: 'data.flowRun.environment', value: { stringValue: 'PRODUCTION' } },
                            { key: 'data.flowRun.flowId', value: { stringValue: 'Wq4eR7tY0uI3oP6aS9dF2' } },
                            { key: 'data.flowRun.flowVersionId', value: { stringValue: 'Zx1cV4bN7mL0kJ3hG6fD9' } },
                            { key: 'data.flowRun.flowDisplayName', value: { stringValue: 'Invoice sync' } },
                            { key: 'data.flowRun.status', value: { stringValue: 'FAILED' } },
                            { key: 'data.project.displayName', value: { stringValue: 'Finance Ops' } },
                        ],
                    }],
                }],
            }],
        })
    })

    it('leaves out the envelope fields a worker-sourced event does not carry', () => {
        const keys = attributeKeysOf(otlpLogs.buildExportRequest({ event: flowRunFinished, environment: 'prod' }))

        expect(keys).not.toContain('userId')
        expect(keys).not.toContain('userEmail')
        expect(keys).not.toContain('ip')
        expect(keys).not.toContain('created')
        expect(keys).not.toContain('updated')
        expect(keys).not.toContain('data')
        expect(keys).not.toContain('environment')
    })

    it('keeps the user fields of a request-sourced event', () => {
        const event = buildMockEvent({ event: ApplicationEventName.FLOW_CREATED, platformId: 'platform-1', projectId: 'project-1' })
        const keys = attributeKeysOf(otlpLogs.buildExportRequest({ event, environment: 'prod' }))

        expect(keys).toEqual(expect.arrayContaining(['userId', 'userEmail', 'ip', 'projectDisplayName']))
    })

    it('sends an array as one JSON string and a date as an ISO string', () => {
        const piecesUpgraded = buildMockEvent({ event: ApplicationEventName.FLOW_PIECES_UPGRADED, platformId: 'platform-1', projectId: 'project-1' })
        const connection: ConnectionEvent = {
            ...buildMockEvent({ event: ApplicationEventName.CONNECTION_UPSERTED, platformId: 'platform-1', projectId: 'project-1' }),
            action: ApplicationEventName.CONNECTION_UPSERTED,
            data: {
                connection: {
                    id: 'connection-1',
                    displayName: 'Sample connection',
                    externalId: 'sample-connection',
                    pieceName: '@activepieces/piece-sample',
                    status: 'ACTIVE',
                    type: 'CUSTOM_AUTH',
                    created: new Date('2026-09-23T10:15:42.318Z'),
                    updated: '2026-09-23T10:15:42.318Z',
                },
            },
        }

        const steps = attributeOf({ request: otlpLogs.buildExportRequest({ event: piecesUpgraded, environment: 'prod' }), key: 'data.steps' })
        const created = attributeOf({ request: otlpLogs.buildExportRequest({ event: connection, environment: 'prod' }), key: 'data.connection.created' })

        expect(steps?.value.stringValue).toBe(JSON.stringify('steps' in piecesUpgraded.data ? piecesUpgraded.data.steps : undefined))
        expect(created?.value.stringValue).toBe('2026-09-23T10:15:42.318Z')
    })
})

describe('otlpLogs.encodeExportRequest', () => {
    it('round-trips the built request through protobuf', () => {
        const request = otlpLogs.buildExportRequest({ event: flowRunFinished, environment: 'prod' })

        expect(decode(otlpLogs.encodeExportRequest(request))).toEqual(request)
    })

    it('keeps nanosecond timestamps and 64-bit integers above 2^53 exact', () => {
        const request = {
            resourceLogs: [{
                scopeLogs: [{
                    logRecords: [{
                        timeUnixNano: '1790158542318000001',
                        attributes: [{ key: 'count', value: { intValue: '9007199254740993' } }, { key: 'ok', value: { boolValue: false } }],
                    }],
                }],
            }],
        }

        expect(decode(otlpLogs.encodeExportRequest(request))).toEqual(request)
    })
})

function decode(bytes: Uint8Array): unknown {
    const type = Root.fromJSON(OFFICIAL_FIELD_NUMBERS).lookupType('check.ExportLogsServiceRequest')
    return type.toObject(type.decode(bytes), { longs: String, defaults: false })
}

function attributeKeysOf(request: ReturnType<typeof otlpLogs.buildExportRequest>): string[] {
    return request.resourceLogs[0].scopeLogs[0].logRecords[0].attributes.map((attribute) => attribute.key)
}

function attributeOf({ request, key }: { request: ReturnType<typeof otlpLogs.buildExportRequest>, key: string }) {
    return request.resourceLogs[0].scopeLogs[0].logRecords[0].attributes.find((attribute) => attribute.key === key)
}

const OFFICIAL_FIELD_NUMBERS = {
    nested: {
        check: {
            nested: {
                AnyValue: {
                    oneofs: { value: { oneof: ['stringValue', 'boolValue', 'intValue'] } },
                    fields: { stringValue: { type: 'string', id: 1 }, boolValue: { type: 'bool', id: 2 }, intValue: { type: 'int64', id: 3 } },
                },
                KeyValue: { fields: { key: { type: 'string', id: 1 }, value: { type: 'AnyValue', id: 2 } } },
                Resource: { fields: { attributes: { rule: 'repeated', type: 'KeyValue', id: 1 } } },
                InstrumentationScope: { fields: { name: { type: 'string', id: 1 } } },
                LogRecord: {
                    fields: {
                        timeUnixNano: { type: 'fixed64', id: 1 },
                        severityNumber: { type: 'int32', id: 2 },
                        severityText: { type: 'string', id: 3 },
                        body: { type: 'AnyValue', id: 5 },
                        attributes: { rule: 'repeated', type: 'KeyValue', id: 6 },
                        eventName: { type: 'string', id: 12 },
                    },
                },
                ScopeLogs: { fields: { scope: { type: 'InstrumentationScope', id: 1 }, logRecords: { rule: 'repeated', type: 'LogRecord', id: 2 } } },
                ResourceLogs: { fields: { resource: { type: 'Resource', id: 1 }, scopeLogs: { rule: 'repeated', type: 'ScopeLogs', id: 2 } } },
                ExportLogsServiceRequest: { fields: { resourceLogs: { rule: 'repeated', type: 'ResourceLogs', id: 1 } } },
            },
        },
    },
}
