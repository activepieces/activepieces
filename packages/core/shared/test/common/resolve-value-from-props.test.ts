import { describe, expect, it } from 'vitest'
import { resolveValueFromProps } from '../../src/lib/automation/app-connection/app-connection'

describe('resolveValueFromProps', () => {
    it('substitutes every occurrence of a placeholder, not just the first', () => {
        expect(resolveValueFromProps({ tenant: 'contoso' }, 'https://host/{tenant}/x/{tenant}'))
            .toBe('https://host/contoso/x/contoso')
    })

    it('inserts prop values literally instead of expanding replacement patterns', () => {
        expect(resolveValueFromProps({ tenant: 'a$&b' }, 'https://host/{tenant}'))
            .toBe('https://host/a$&b')
    })

    it('leaves placeholders that have no matching prop untouched', () => {
        expect(resolveValueFromProps({ cloud: 'login.microsoftonline.com' }, 'https://{cloud}/{tenant}/token'))
            .toBe('https://login.microsoftonline.com/{tenant}/token')
    })

    it('returns the value unchanged when there are no props', () => {
        expect(resolveValueFromProps(undefined, 'https://{cloud}/token')).toBe('https://{cloud}/token')
    })
})
