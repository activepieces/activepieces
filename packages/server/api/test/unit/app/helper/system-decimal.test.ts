import { afterEach, describe, expect, it } from 'vitest'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'

const ENV_KEY = `AP_${AppSystemProp.AI_CREDIT_USD_VALUE}`

afterEach(() => {
    delete process.env[ENV_KEY]
})

describe('system.getDecimalOrThrow', () => {
    it('reads the shipped default as the fraction it is, not zero', () => {
        expect(system.getDecimalOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)).toBeCloseTo(0.0005, 10)
    })

    it('reads a fractional value a self-hoster set, which getNumber would truncate to zero', () => {
        process.env[ENV_KEY] = '0.002'

        expect(system.getDecimalOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)).toBeCloseTo(0.002, 10)
        expect(system.getNumber(AppSystemProp.AI_CREDIT_USD_VALUE)).toBe(0)
    })

    it('still reads a whole number', () => {
        process.env[ENV_KEY] = '2'

        expect(system.getDecimalOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)).toBe(2)
    })

    it('throws on a value that is not a number at all, instead of silently reading zero', () => {
        process.env[ENV_KEY] = 'cheap'

        expect(() => system.getDecimalOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)).toThrow()
    })
})
