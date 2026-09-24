import { brandColors } from '../../src/lib/core/common/brand-colors'

describe('brandColors.cssVariables', () => {
    it('renders the tenant hex verbatim as --primary', () => {
        const variables = brandColors.cssVariables({ primaryColor: '#FF6600', theme: 'light' })
        expect(variables['--primary']).toBe('#FF6600')
    })

    it('generates a full primary ramp and ink ramp at the tenant hue', () => {
        const variables = brandColors.cssVariables({ primaryColor: '#6e41e2', theme: 'light' })
        const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
        steps.forEach((step) => {
            expect(variables[`--primary-${step}`]).toMatch(/^oklch\(/)
        })
        expect(variables['--ink-500']).toMatch(/^oklch\(/)
        expect(variables['--ink-150']).toMatch(/^oklch\(/)
    })

    it('puts the whole ramp on one hue', () => {
        const variables = brandColors.cssVariables({ primaryColor: '#0ea5e9', theme: 'light' })
        const hues = ['100', '500', '900'].map((step) => {
            const match = variables[`--primary-${step}`].match(/oklch\([\d.]+% [\d.]+ ([\d.]+)\)/)
            return match?.[1]
        })
        expect(new Set(hues).size).toBe(1)
    })

    it('retints the ink ramp to the tenant hue, not the default violet', () => {
        const orange = brandColors.cssVariables({ primaryColor: '#FF6600', theme: 'light' })
        const violet = brandColors.cssVariables({ primaryColor: '#6e41e2', theme: 'light' })
        expect(orange['--ink-500']).not.toBe(violet['--ink-500'])
    })

    it('inverts the ink ramp in dark mode', () => {
        const light = brandColors.cssVariables({ primaryColor: '#6e41e2', theme: 'light' })
        const dark = brandColors.cssVariables({ primaryColor: '#6e41e2', theme: 'dark' })
        const lightness = (value: string) => Number(value.match(/oklch\(([\d.]+)%/)?.[1])
        expect(lightness(light['--ink-50'])).toBeGreaterThan(90)
        expect(lightness(dark['--ink-50'])).toBeLessThan(25)
    })

    it('keeps the primary ramp identical across themes', () => {
        const light = brandColors.cssVariables({ primaryColor: '#6e41e2', theme: 'light' })
        const dark = brandColors.cssVariables({ primaryColor: '#6e41e2', theme: 'dark' })
        expect(light['--primary-500']).toBe(dark['--primary-500'])
    })

    it('returns nothing for an unparseable colour rather than emitting invalid css', () => {
        expect(brandColors.cssVariables({ primaryColor: 'not-a-colour', theme: 'light' })).toEqual({})
    })

    it('accepts shorthand hex', () => {
        const variables = brandColors.cssVariables({ primaryColor: '#f60', theme: 'light' })
        expect(variables['--primary-500']).toMatch(/^oklch\(/)
    })
})

describe('brandColors.onPrimaryFor', () => {
    it('picks white on the default purple', () => {
        expect(brandColors.onPrimaryFor({ hex: '#6e41e2' })).toBe('#ffffff')
    })

    it('picks black on a bright yellow, where white measures 1.9:1', () => {
        expect(brandColors.onPrimaryFor({ hex: '#eab308' })).toBe('#000000')
    })

    it('picks black on the sky blue that fails AA under white', () => {
        expect(brandColors.onPrimaryFor({ hex: '#0ea5e9' })).toBe('#000000')
    })
})

describe('brandColors.contrastRatio', () => {
    it('measures black on white at 21:1', () => {
        expect(brandColors.contrastRatio({ foreground: '#000000', background: '#ffffff' })).toBeCloseTo(21, 1)
    })

    it('measures a colour against itself at 1:1', () => {
        expect(brandColors.contrastRatio({ foreground: '#6e41e2', background: '#6e41e2' })).toBeCloseTo(1, 5)
    })

    it('reproduces the 5.9:1 that white on the default purple measures', () => {
        expect(brandColors.contrastRatio({ foreground: '#ffffff', background: '#6e41e2' })).toBeCloseTo(5.97, 1)
    })
})
