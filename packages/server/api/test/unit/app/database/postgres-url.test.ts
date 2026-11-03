import { describe, expect, it } from 'vitest'
import { postgresUrl } from '../../../../src/app/database/postgres-url'

describe('postgresUrl.dropSslModeParams', () => {
    it('removes sslmode so it cannot override the ssl config that carries the CA', () => {
        const url = postgresUrl.dropSslModeParams({ url: 'postgresql://user:p%40ss@db.internal:5432/ap?sslmode=require&application_name=migrations' })
        expect(url).toBe('postgresql://user:p%40ss@db.internal:5432/ap?application_name=migrations')
    })

    it('removes ssl and uselibpqcompat too', () => {
        const url = postgresUrl.dropSslModeParams({ url: 'postgresql://user:pass@db.internal:5432/ap?ssl=true&uselibpqcompat=true&sslmode=verify-full' })
        expect(url).toBe('postgresql://user:pass@db.internal:5432/ap')
    })

    it('leaves a URL without ssl params unchanged', () => {
        const url = 'postgresql://user:pass@db.internal:5432/ap'
        expect(postgresUrl.dropSslModeParams({ url })).toBe(url)
    })
})
