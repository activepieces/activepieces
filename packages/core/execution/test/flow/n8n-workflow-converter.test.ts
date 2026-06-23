import { describe, expect, it } from 'vitest'

import { FlowActionType } from '../../src/lib/flows/actions/action'
import { n8nWorkflowConverter } from '../../src/lib/flows/n8n-import'
import { FlowTriggerType } from '../../src/lib/flows/triggers/trigger'

describe('n8nWorkflowConverter', () => {
    it('converts an n8n HTTP workflow into an import request', () => {
        const result = n8nWorkflowConverter.convert({
            workflow: {
                name: 'n8n HTTP workflow',
                nodes: [
                    {
                        id: 'manual',
                        name: 'Manual Trigger',
                        type: 'n8n-nodes-base.manualTrigger',
                        parameters: {},
                    },
                    {
                        id: 'http',
                        name: 'Send Request',
                        type: 'n8n-nodes-base.httpRequest',
                        parameters: {
                            method: 'POST',
                            url: 'https://example.com/api',
                            sendBody: true,
                            jsonBody: {
                                hello: 'world',
                            },
                        },
                    },
                ],
                connections: {
                    'Manual Trigger': {
                        main: [
                            [
                                {
                                    node: 'Send Request',
                                },
                            ],
                        ],
                    },
                },
            },
        })

        expect(result.report).toEqual([])
        expect(result.request.displayName).toBe('n8n HTTP workflow')
        expect(result.request.trigger.type).toBe(FlowTriggerType.EMPTY)
        expect(result.request.trigger.nextAction?.type).toBe(FlowActionType.PIECE)
        expect(result.request.trigger.nextAction?.settings.input).toMatchObject({
            method: 'POST',
            url: 'https://example.com/api',
            body_type: 'json',
        })
    })

    it('imports unsupported nodes as skipped placeholders with warnings', () => {
        const result = n8nWorkflowConverter.convert({
            workflow: {
                name: 'Unsupported n8n workflow',
                nodes: [
                    {
                        id: 'trigger',
                        name: 'Manual Trigger',
                        type: 'n8n-nodes-base.manualTrigger',
                        parameters: {},
                    },
                    {
                        id: 'slack',
                        name: 'Slack',
                        type: 'n8n-nodes-base.slack',
                        parameters: {},
                    },
                ],
                connections: {
                    'Manual Trigger': {
                        main: [
                            [
                                {
                                    node: 'Slack',
                                },
                            ],
                        ],
                    },
                },
            },
        })

        expect(result.report).toHaveLength(1)
        expect(result.report[0]).toMatchObject({
            nodeName: 'Slack',
            nodeType: 'n8n-nodes-base.slack',
            severity: 'warning',
        })
        expect(result.request.trigger.nextAction?.type).toBe(FlowActionType.CODE)
        expect(result.request.trigger.nextAction?.skip).toBe(true)
    })

    it('parses n8n workflow JSON', () => {
        const result = n8nWorkflowConverter.parse({
            value: JSON.stringify({
                nodes: [],
                connections: {},
            }),
        })

        expect(result.success).toBe(true)
    })
})
