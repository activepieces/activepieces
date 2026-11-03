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
