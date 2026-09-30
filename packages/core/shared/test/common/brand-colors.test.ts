import { brandColors, STATUS_SCALES } from '../../src/lib/core/common/brand-colors'

describe('brandColors.cssVariables', () => {
    it('writes exactly the four seed properties', () => {
        const variables = brandColors.cssVariables({ primaryColor: '#6e41e2' })
        expect(Object.keys(variables).sort()).toEqual(['--accent-9', '--brand-c', '--brand-h', '--on-accent'])
    })

    it('renders the tenant hex verbatim as --accent-9', () => {
        expect(brandColors.cssVariables({ primaryColor: '#FF6600' })['--accent-9']).toBe('#FF6600')
    })

    it('follows the tenant hue', () => {
        const orange = brandColors.cssVariables({ primaryColor: '#FF6600' })
        const violet = brandColors.cssVariables({ primaryColor: '#6e41e2' })
        expect(orange['--brand-h']).not.toBe(violet['--brand-h'])
    })

    it('keeps the chroma scale of a coloured brand between 0.4 and 1', () => {
        const muted = brandColors.cssVariables({ primaryColor: '#1f2937' })
        const vivid = brandColors.cssVariables({ primaryColor: '#ff00ff' })
        expect(Number(muted['--brand-c'])).toBe(0.4)
        expect(Number(vivid['--brand-c'])).toBeLessThanOrEqual(1)
    })

    it('drops all chroma for a black, grey or white brand', () => {
        ['#000000', '#333333', '#808080', '#ffffff'].forEach((primaryColor) => {
            expect(brandColors.cssVariables({ primaryColor })['--brand-c']).toBe('0')
        })
    })

    it('measures --on-accent against the tenant hex', () => {
        expect(brandColors.cssVariables({ primaryColor: '#eab308' })['--on-accent']).toBe('#000000')
        expect(brandColors.cssVariables({ primaryColor: '#6e41e2' })['--on-accent']).toBe('#ffffff')
    })

    it('falls back to the default seed for an unparseable colour', () => {
        expect(brandColors.cssVariables({ primaryColor: 'not-a-colour' })).toEqual({
            '--brand-h': '288.86',
            '--brand-c': '1',
            '--accent-9': '#6e41e2',
            '--on-accent': '#ffffff',
        })
    })

    it('writes a hex given without its hash as valid css', () => {
        expect(brandColors.cssVariables({ primaryColor: 'ff6600' })['--accent-9']).toBe('#ff6600')
    })

    it('reads shorthand hex the same as its long form', () => {
        const short = brandColors.cssVariables({ primaryColor: '#f60' })
        const long = brandColors.cssVariables({ primaryColor: '#ff6600' })
        expect(short['--brand-h']).toBe(long['--brand-h'])
        expect(short['--brand-c']).toBe(long['--brand-c'])
        expect(short['--accent-9']).toBe('#f60')
    })
})

describe('brandColors.statusCssVariables', () => {
    it('writes nothing when no status colour is chosen', () => {
        expect(brandColors.statusCssVariables({ statusColors: {} })).toEqual({})
    })

    it('writes exactly the four seed properties of each chosen scale', () => {
        const variables = brandColors.statusCssVariables({ statusColors: { danger: '#b91c1c', success: '#16a34a' } })
        expect(Object.keys(variables).sort()).toEqual([
            '--danger-c',
            '--danger-h',
            '--danger-seed',
            '--on-danger-seed',
            '--on-success-seed',
            '--success-c',
            '--success-h',
            '--success-seed',
        ])
    })

    it('renders the chosen hex verbatim as the solid', () => {
        expect(brandColors.statusCssVariables({ statusColors: { warning: '#FACC15' } })['--warning-seed']).toBe('#FACC15')
    })

    it('follows the chosen hue', () => {
        const pink = brandColors.statusCssVariables({ statusColors: { danger: '#db2777' } })
        const red = brandColors.statusCssVariables({ statusColors: { danger: '#dc2626' } })
        expect(pink['--danger-h']).not.toBe(red['--danger-h'])
    })

    it('keeps the stock scale for its own default solid', () => {
        STATUS_SCALES.forEach((scale) => {
            const variables = brandColors.statusCssVariables({
                statusColors: { [scale]: brandColors.defaultStatusColor({ scale }) },
            })
            expect(Number(variables[`--${scale}-c`])).toBeCloseTo(1, 1)
        })
    })

    it('drops all chroma for a grey status colour and keeps the stock hue', () => {
        const variables = brandColors.statusCssVariables({ statusColors: { success: '#808080' } })
        expect(variables['--success-c']).toBe('0')
        expect(variables['--success-h']).toBe('150')
    })

    it('measures the label colour against the chosen solid', () => {
        expect(brandColors.statusCssVariables({ statusColors: { warning: '#facc15' } })['--on-warning-seed']).toBe('#000000')
        expect(brandColors.statusCssVariables({ statusColors: { danger: '#991b1b' } })['--on-danger-seed']).toBe('#ffffff')
    })

    it('ignores an unparseable colour instead of writing a broken seed', () => {
        expect(brandColors.statusCssVariables({ statusColors: { danger: 'not-a-colour' } })).toEqual({})
    })
})

describe('brandColors.defaultPrimaryColor', () => {
    it('is the solid an unparseable primary colour falls back to', () => {
        expect(brandColors.defaultPrimaryColor()).toBe(
            brandColors.cssVariables({ primaryColor: 'not-a-colour' })['--accent-9'],
        )
    })
})

describe('brandColors.statusVariableNames', () => {
    it('names every property statusCssVariables can write', () => {
        const everything = brandColors.statusCssVariables({
            statusColors: { danger: '#b91c1c', warning: '#facc15', success: '#16a34a' },
        })
        expect(brandColors.statusVariableNames().sort()).toEqual(Object.keys(everything).sort())
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

    it('reproduces the 5.97:1 that white on the default purple measures', () => {
        expect(brandColors.contrastRatio({ foreground: '#ffffff', background: '#6e41e2' })).toBeCloseTo(5.97, 1)
    })
})
