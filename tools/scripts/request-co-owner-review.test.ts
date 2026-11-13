import { describe, expect, it } from 'bun:test'
import { requestCoOwnerReview } from './request-co-owner-review'

describe('coOwnerLogins', () => {
    it('reads the login from a label in the Co-Owner group', () => {
        const labels = [{ name: 'Hazem Adel (@hazemadelkhalel)', parent: { name: 'Co-Owner' } }]
        expect(requestCoOwnerReview.coOwnerLogins({ labels })).toEqual(['hazemadelkhalel'])
    })

    it('ignores labels outside the Co-Owner group and labels with no login', () => {
        const labels = [
            { name: 'Billing (@nobody)', parent: null },
            { name: 'Builder (@nobody)', parent: { name: 'Area' } },
            { name: 'ziyadev', parent: { name: 'Co-Owner' } },
        ]
        expect(requestCoOwnerReview.coOwnerLogins({ labels })).toEqual([])
    })

    it('lists a Co-Owner shared by two tickets once', () => {
        const label = { name: 'Lina (@lina-alomari)', parent: { name: 'Co-Owner' } }
        expect(requestCoOwnerReview.coOwnerLogins({ labels: [label, label] })).toEqual(['lina-alomari'])
    })
})

describe('loginsToRequest', () => {
    it('skips the author and anyone who already reviewed, ignoring case', () => {
        const result = requestCoOwnerReview.loginsToRequest({
            coOwners: ['OthmanEmad', 'amrdb', 'kishanprmr'],
            author: 'othmanemad',
            reviewers: ['AMRDB'],
        })
        expect(result).toEqual(['kishanprmr'])
    })
})

describe('roundRobinPicks', () => {
    const team = (slug: string, at: string) => ({ event: 'review_requested', created_at: at, requested_team: { slug } })
    const user = (login: string, at: string) => ({ event: 'review_requested', created_at: at, requested_reviewer: { login } })
    const teamMembers = { core: ['othmanemad', 'ziyadev'], pieces: ['othmanemad', 'kishanprmr'] }

    it('picks the user requested right after the team, not the Co-Owner requested a few seconds later', () => {
        const events = [
            { event: 'committed', created_at: '2026-11-05T19:26:30Z' },
            team('core', '2026-11-05T19:26:32Z'),
            user('AbdulTheActivePiecer', '2026-11-05T19:26:33Z'),
            user('othmanemad', '2026-11-05T19:26:36Z'),
        ]
        expect(requestCoOwnerReview.roundRobinPicks({ events, coOwners: ['othmanemad'], teamMembers })).toEqual(['AbdulTheActivePiecer'])
    })

    it('never picks the Co-Owner, even when round-robin chose them', () => {
        const events = [team('core', '2026-11-05T19:26:32Z'), user('OthmanEmad', '2026-11-05T19:26:33Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events, coOwners: ['othmanemad'], teamMembers })).toEqual([])
    })

    it('ignores a user requested long after the team', () => {
        const events = [team('core', '2026-11-05T19:26:32Z'), user('kareem834', '2026-11-05T19:40:00Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events, coOwners: ['othmanemad'], teamMembers })).toEqual([])
    })

    it('takes one pick for each team when the Co-Owner is in every requested team', () => {
        const events = [
            team('core', '2026-11-05T19:26:32Z'),
            team('pieces', '2026-11-05T19:26:32Z'),
            user('ziyadev', '2026-11-05T19:26:33Z'),
            user('kishanprmr', '2026-11-05T19:26:33Z'),
            user('lina-alomari', '2026-11-05T19:40:00Z'),
        ]
        expect(requestCoOwnerReview.roundRobinPicks({ events, coOwners: ['othmanemad'], teamMembers })).toEqual(['ziyadev', 'kishanprmr'])
    })

    it('keeps every pick when the Co-Owner is not in one of the requested teams', () => {
        const coreOnly = [team('core', '2026-11-05T19:26:32Z'), user('ziyadev', '2026-11-05T19:26:33Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events: coreOnly, coOwners: ['kishanprmr'], teamMembers })).toEqual([])
        const coreAndPieces = [team('core', '2026-11-05T19:26:32Z'), team('pieces', '2026-11-05T19:26:32Z'), user('ziyadev', '2026-11-05T19:26:33Z'), user('othmanemad', '2026-11-05T19:26:33Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events: coreAndPieces, coOwners: ['ziyadev'], teamMembers })).toEqual([])
    })

    it('keeps an author request when round-robin chose the Co-Owner', () => {
        const events = [team('core', '2026-11-05T19:26:32Z'), user('othmanemad', '2026-11-05T19:26:33Z'), user('lina-alomari', '2026-11-05T19:26:35Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events, coOwners: ['othmanemad'], teamMembers })).toEqual([])
    })

    it('removes only the round-robin pick when the author adds a reviewer in the window', () => {
        const events = [team('core', '2026-11-05T19:26:32Z'), user('ziyadev', '2026-11-05T19:26:33Z'), user('lina-alomari', '2026-11-05T19:26:35Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events, coOwners: ['othmanemad'], teamMembers })).toEqual(['ziyadev'])
    })

    it('keeps a pick that someone requested again later', () => {
        const events = [team('core', '2026-11-05T19:26:32Z'), user('ziyadev', '2026-11-05T19:26:33Z'), user('ziyadev', '2026-11-06T10:00:00Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events, coOwners: ['othmanemad'], teamMembers })).toEqual([])
    })
})
