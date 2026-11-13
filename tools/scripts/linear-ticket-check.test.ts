import { describe, expect, it } from 'bun:test'
import { linearTicketCheck } from './linear-ticket-check'

describe('findTickets', () => {
    it('reads Fixes and Refs for every team key', () => {
        const body = 'Fixes ENG-123\nRefs AI-45\nrefs sre-7\nFixes GIT-8 and Refs PIE-9'
        expect(linearTicketCheck.findTickets({ body })).toEqual(['ENG-123', 'AI-45', 'SRE-7', 'GIT-8', 'PIE-9'])
    })

    it('reads a colon after the keyword and a Markdown link', () => {
        const body = 'Fixes: ENG-1\nRefs [AI-2](https://linear.app/activepieces/issue/AI-2/title)'
        expect(linearTicketCheck.findTickets({ body })).toEqual(['ENG-1', 'AI-2'])
    })

    it('ignores the unedited template placeholder', () => {
        expect(linearTicketCheck.findTickets({ body: '### Linear ticket\n\nFixes ENG-\n' })).toEqual([])
    })

    it('ignores tickets inside HTML comments', () => {
        expect(linearTicketCheck.findTickets({ body: '<!-- Fixes ENG-1 -->' })).toEqual([])
    })

    it('ignores unknown team keys and bare ticket IDs', () => {
        expect(linearTicketCheck.findTickets({ body: 'Fixes FOO-1\nSee ENG-2\nFixes #123' })).toEqual([])
    })

    it('lists a repeated ticket once', () => {
        expect(linearTicketCheck.findTickets({ body: 'Refs ENG-5\nFixes ENG-5' })).toEqual(['ENG-5'])
    })
})

describe('ticketProblem', () => {
    it('fails a missing ticket', () => {
        expect(linearTicketCheck.ticketProblem({ id: 'ENG-1', stateType: null })).toContain('does not exist')
    })

    it('fails a canceled or duplicate ticket', () => {
        expect(linearTicketCheck.ticketProblem({ id: 'ENG-1', stateType: 'canceled' })).toContain('canceled')
        expect(linearTicketCheck.ticketProblem({ id: 'ENG-1', stateType: 'duplicate' })).toContain('duplicate')
    })

    it('passes a ticket in any other status', () => {
        for (const stateType of ['triage', 'backlog', 'unstarted', 'started', 'completed']) {
            expect(linearTicketCheck.ticketProblem({ id: 'ENG-1', stateType })).toBeNull()
        }
    })
})
