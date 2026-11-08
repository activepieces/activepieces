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
    const team = (at: string) => ({ event: 'review_requested', created_at: at, requested_team: { slug: 'core' } })
    const user = (login: string, at: string) => ({ event: 'review_requested', created_at: at, requested_reviewer: { login } })

    it('picks the first user requested right after the team, not the Co-Owner requested later', () => {
        const events = [
            { event: 'committed', created_at: '2026-11-05T19:26:30Z' },
            team('2026-11-05T19:26:32Z'),
            user('AbdulTheActivePiecer', '2026-11-05T19:26:33Z'),
            user('othmanemad', '2026-11-05T19:26:36Z'),
        ]
        expect(requestCoOwnerReview.roundRobinPicks({ events, keep: ['othmanemad'] })).toEqual(['AbdulTheActivePiecer'])
    })

    it('never picks the Co-Owner, even when round-robin chose them', () => {
        const events = [team('2026-11-05T19:26:32Z'), user('OthmanEmad', '2026-11-05T19:26:33Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events, keep: ['othmanemad'] })).toEqual([])
    })

    it('ignores a user requested long after the team', () => {
        const events = [team('2026-11-05T19:26:32Z'), user('kareem834', '2026-11-05T19:40:00Z')]
        expect(requestCoOwnerReview.roundRobinPicks({ events, keep: ['othmanemad'] })).toEqual([])
    })

    it('takes one pick for each team request', () => {
        const events = [
            team('2026-11-05T19:26:32Z'),
            { ...team('2026-11-05T19:26:32Z'), requested_team: { slug: 'pieces' } },
            user('ziyadev', '2026-11-05T19:26:33Z'),
            user('kishanprmr', '2026-11-05T19:26:33Z'),
            user('lina-alomari', '2026-11-05T19:26:34Z'),
        ]
        expect(requestCoOwnerReview.roundRobinPicks({ events, keep: ['othmanemad'] })).toEqual(['ziyadev', 'kishanprmr'])
    })
})
