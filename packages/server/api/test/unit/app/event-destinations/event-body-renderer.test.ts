import { formulaEvaluator } from '@activepieces/core-formula'
import { ApplicationEventName, buildMockEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { renderEventBody } from '../../../../src/app/event-destinations/event-body-renderer'

const log: Pick<FastifyBaseLogger, 'warn'> = { warn: vi.fn() }

const event = buildMockEvent({
    event: ApplicationEventName.FLOW_RUN_FINISHED,
    platformId: 'platform-id',
    projectId: 'project-id',
})

describe('renderEventBody', () => {
    it('returns the raw event untouched when there is no mapper', () => {
        expect(renderEventBody({ mapper: null, event, destinationId: 'dest', log })).toBe(event)
        expect(renderEventBody({ mapper: undefined, event, destinationId: 'dest', log })).toBe(event)
    })

    it('resolves a token that spans the whole leaf to its native type', () => {
        const rendered = renderEventBody({
            mapper: {
                action: '{{ action }}',
                duration: '{{ data.flowRun.duration }}',
                flowRun: '{{ data.flowRun }}',
                missing: '{{ data.nowhere.at.all }}',
            },
            event,
            destinationId: 'dest',
            log,
        })

        expect(rendered).toEqual({
            action: ApplicationEventName.FLOW_RUN_FINISHED,
            duration: 1234,
            flowRun: event.data.flowRun,
            missing: null,
        })
    })

    it('padding a lone token with whitespace forces a string instead of the native type', () => {
        const rendered = renderEventBody({
            mapper: { native: '{{ data.flowRun.duration }}', forcedToString: ' {{ data.flowRun.duration }} ' },
            event,
            destinationId: 'dest',
            log,
        })

        expect(rendered).toEqual({ native: 1234, forcedToString: '1234' })
    })

    it('interpolates a token surrounded by text into a string', () => {
        const rendered = renderEventBody({
            mapper: { line: '{{ action }} - {{ data.project.displayName }}' },
            event,
            destinationId: 'dest',
            log,
        })

        expect(rendered).toEqual({ line: 'flow.run.finished - Dream Department' })
    })

    it('leaves a leaf with no token as a literal', () => {
        const rendered = renderEventBody({
            mapper: { app: 'activepieces', nested: { keep: 'me' } },
            event,
            destinationId: 'dest',
            log,
        })

        expect(rendered).toEqual({ app: 'activepieces', nested: { keep: 'me' } })
    })

    it('walks arrays and preserves non-string leaves', () => {
        const rendered = renderEventBody({
            mapper: { streams: [{ values: [['{{ action }}', 7, true, null]] }] },
            event,
            destinationId: 'dest',
            log,
        })

        expect(rendered).toEqual({
            streams: [{ values: [[ApplicationEventName.FLOW_RUN_FINISHED, 7, true, null]] }],
        })
    })

    it('evaluates a wrapped formula with its built-in functions', () => {
        const rendered = renderEventBody({
            mapper: { label: formulaEvaluator.wrap('uppercase({{ data.flowRun.status }})') },
            event,
            destinationId: 'dest',
            log,
        })

        expect(rendered).toEqual({ label: 'FAILED' })
    })

    it('renders null and warns when an expression fails, rather than dropping the event', () => {
        const warn = vi.fn()
        const rendered = renderEventBody({
            mapper: { broken: formulaEvaluator.wrap('no_such_function({{ action }})') },
            event,
            destinationId: 'dest',
            log: { warn },
        })

        expect(rendered).toEqual({ broken: null })
        expect(warn).toHaveBeenCalledTimes(1)
    })

    it('produces JSON-serialisable output for every event name', () => {
        const mapper = {
            action: '{{ action }}',
            at: '{{ created }}',
            platform: '{{ platformId }}',
            summary: 'event {{ action }} on {{ platformId }}',
        }
        for (const name of Object.values(ApplicationEventName)) {
            const mockEvent = buildMockEvent({ event: name, platformId: 'platform-id', projectId: 'project-id' })
            const rendered = renderEventBody({ mapper, event: mockEvent, destinationId: 'dest', log })
            expect(() => JSON.stringify(rendered)).not.toThrow()
            expect(rendered).toMatchObject({ action: name, platform: 'platform-id' })
        }
    })
})
