import { isNil } from '@activepieces/core-utils'
import { ApplicationEventName, buildMockEvent, DestinationType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { destinationPresets } from '../../../../src/app/event-destinations/destination-presets'
import { renderEventBody } from '../../../../src/app/event-destinations/event-body-renderer'

const warn = vi.fn()
const log: Pick<FastifyBaseLogger, 'warn'> = { warn }

const presetOf = (type: DestinationType) => {
    const preset = destinationPresets.find((candidate) => candidate.type === type)
    if (isNil(preset)) {
        throw new Error(`destinationPresets is missing an entry for ${type}`)
    }
    return preset
}

const lokiBodySchema = z.object({
    streams: z.array(z.object({
        stream: z.record(z.string(), z.string()),
        values: z.array(z.array(z.string())),
    })),
})

const envelopeSchema = z.record(z.string(), z.unknown())

describe('destinationPresets', () => {
    it('covers every destination type exactly once', () => {
        const types = destinationPresets.map((preset) => preset.type)
        expect(new Set(types).size).toBe(types.length)
        expect(new Set(types)).toEqual(new Set(Object.values(DestinationType)))
    })

    it('leaves Custom JSON without a mapper, so it keeps posting the raw event', () => {
        expect(presetOf(DestinationType.CUSTOM).defaultMapper).toBeNull()
    })

    it('shows no formula wrapper to the user, because the renderer wraps a whole-leaf expression itself', () => {
        for (const preset of destinationPresets) {
            expect(JSON.stringify(preset), `${preset.type} leaks the formula wrapper into the mapper editor`)
                .not.toContain('ap-formula')
        }
    })

    it('renders every preset to serialisable JSON for every event, with no expression errors', () => {
        for (const preset of destinationPresets) {
            for (const name of Object.values(ApplicationEventName)) {
                warn.mockClear()
                const event = buildMockEvent({ event: name, platformId: 'platform-id', projectId: 'project-id' })
                const rendered = renderEventBody({
                    mapper: preset.defaultMapper,
                    event,
                    destinationId: 'dest',
                    log,
                })

                expect(warn, `${preset.type} / ${name} logged a render error`).not.toHaveBeenCalled()
                expect(() => JSON.stringify(rendered)).not.toThrow()
                expect(JSON.stringify(rendered), `${preset.type} / ${name} stringified an object with String()`)
                    .not.toContain('[object Object]')
            }
        }
    })

    it('builds a nanosecond string timestamp and a string log line for Loki', () => {
        const event = buildMockEvent({
            event: ApplicationEventName.FLOW_RUN_FINISHED,
            platformId: 'platform-id',
            projectId: 'project-id',
        })
        const rendered = lokiBodySchema.parse(renderEventBody({
            mapper: presetOf(DestinationType.LOKI).defaultMapper,
            event,
            destinationId: 'dest',
            log,
        }))

        const [timestamp, line] = rendered.streams[0].values[0]
        expect(timestamp).toMatch(/^\d{19}$/)
        expect(String(new Date(event.created).valueOf())).toBe(timestamp.slice(0, 13))
        expect(typeof line).toBe('string')
        expect(line).toContain(ApplicationEventName.FLOW_RUN_FINISHED)
        const json = line.slice(line.indexOf(' ') + 1)
        expect(JSON.parse(json)).toEqual(event.data)
        expect(rendered.streams[0].stream).toEqual({ app: 'activepieces', event: ApplicationEventName.FLOW_RUN_FINISHED })
    })

    it('gives Splunk whole seconds and New Relic milliseconds', () => {
        const event = buildMockEvent({
            event: ApplicationEventName.FLOW_CREATED,
            platformId: 'platform-id',
            projectId: 'project-id',
        })
        const epochMs = new Date(event.created).valueOf()

        const splunk = z.object({ time: z.number() }).parse(renderEventBody({ mapper: presetOf(DestinationType.SPLUNK).defaultMapper, event, destinationId: 'd', log }))
        const newRelic = z.object({ timestamp: z.number() }).parse(renderEventBody({ mapper: presetOf(DestinationType.NEW_RELIC).defaultMapper, event, destinationId: 'd', log }))

        expect(splunk.time).toBe(Math.floor(epochMs / 1000))
        expect(newRelic.timestamp).toBe(epochMs)
    })

    it('fills the enriched envelope fields for request-sourced events', () => {
        const event = buildMockEvent({
            event: ApplicationEventName.FLOW_CREATED,
            platformId: 'platform-id',
            projectId: 'project-id',
        })
        const rendered = envelopeSchema.parse(renderEventBody({
            mapper: presetOf(DestinationType.DATADOG).defaultMapper,
            event,
            destinationId: 'dest',
            log,
        }))

        expect(rendered.projectDisplayName).toBe(event.projectDisplayName)
        expect(rendered.userEmail).toBe(event.userEmail)
        expect(rendered.projectDisplayName).not.toBeNull()
        expect(rendered.userEmail).not.toBeNull()
    })

    it('renders envelope fields absent on worker-sourced events as null rather than failing', () => {
        const event = buildMockEvent({
            event: ApplicationEventName.FLOW_RUN_STARTED,
            platformId: 'platform-id',
            projectId: 'project-id',
        })
        const rendered = envelopeSchema.parse(renderEventBody({
            mapper: presetOf(DestinationType.DATADOG).defaultMapper,
            event,
            destinationId: 'dest',
            log,
        }))

        expect(rendered.event).toBe(ApplicationEventName.FLOW_RUN_STARTED)
        expect(rendered.platformId).toBe('platform-id')
        expect(rendered.projectDisplayName).toBeNull()
    })
})
