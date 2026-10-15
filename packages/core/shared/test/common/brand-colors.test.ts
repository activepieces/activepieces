import { brandColors } from '../../src/lib/core/common/brand-colors'

const LIGHT_GROUNDS = [100, 99.3, 98.2, 97, 95.5, 93.8]
const DARK_GROUNDS = [11, 16.2, 19.5, 23.5, 27.5]

describe('brandColors.cssVariables', () => {
    it('writes a light and a dark value for every accent step, plus the label', () => {
        const variables = brandColors.cssVariables({ primaryColor: '#6e41e2' })
        expect(Object.keys(variables)).toHaveLength(25)
        expect(variables['--on-accent']).toBe('#ffffff')
        brandColors.steps.forEach((step) => {
            expect(variables[`--accent-light-${step}`]).toBeDefined()
            expect(variables[`--accent-dark-${step}`]).toBeDefined()
        })
    })

    it('renders the tenant hex verbatim as step 9 in both themes', () => {
        const variables = brandColors.cssVariables({ primaryColor: '#FF6600' })
        expect(variables['--accent-light-9']).toBe('#FF6600')
        expect(variables['--accent-dark-9']).toBe('#FF6600')
    })

    it('follows the tenant hue', () => {
        const orange = brandColors.cssVariables({ primaryColor: '#FF6600' })
        const violet = brandColors.cssVariables({ primaryColor: '#6e41e2' })
        expect(hueOf({ value: orange['--accent-light-3'] })).not.toBeCloseTo(hueOf({ value: violet['--accent-light-3'] }), 0)
    })

    it('renders a black, grey or white brand as a neutral ramp', () => {
        ['#000000', '#333333', '#808080', '#ffffff'].forEach((primaryColor) => {
            const variables = brandColors.cssVariables({ primaryColor })
            expect(chromaOf({ value: variables['--accent-light-3'] })).toBe(0)
            expect(chromaOf({ value: variables['--accent-dark-11'] })).toBe(0)
        })
    })

    it('measures --on-accent against the tenant hex', () => {
        expect(brandColors.cssVariables({ primaryColor: '#eab308' })['--on-accent']).toBe('#000000')
        expect(brandColors.cssVariables({ primaryColor: '#6e41e2' })['--on-accent']).toBe('#ffffff')
    })

    it('falls back to the default brand for an unparseable colour', () => {
        expect(brandColors.cssVariables({ primaryColor: 'not-a-colour' })).toEqual(
            brandColors.cssVariables({ primaryColor: brandColors.defaultPrimaryColor() }),
        )
    })

    it('writes a hex given without its hash as valid css', () => {
        expect(brandColors.cssVariables({ primaryColor: 'ff6600' })['--accent-light-9']).toBe('#ff6600')
    })
})

describe('brandColors.statusCssVariables', () => {
    it('writes nothing when no status colour is chosen', () => {
        expect(brandColors.statusCssVariables({ statusColors: {} })).toEqual({})
    })

    it('writes both themes of every step and the label for each chosen scale only', () => {
        const variables = brandColors.statusCssVariables({ statusColors: { danger: '#b91c1c', success: '#16a34a' } })
        expect(Object.keys(variables)).toHaveLength(50)
        expect(variables['--on-danger-seed']).toBeDefined()
        expect(variables['--warning-light-3']).toBeUndefined()
    })

    it('renders the chosen hex verbatim as the solid', () => {
        expect(brandColors.statusCssVariables({ statusColors: { warning: '#FACC15' } })['--warning-light-9']).toBe('#FACC15')
    })

    it('measures the label colour against the chosen solid', () => {
        expect(brandColors.statusCssVariables({ statusColors: { warning: '#facc15' } })['--on-warning-seed']).toBe('#000000')
        expect(brandColors.statusCssVariables({ statusColors: { danger: '#991b1b' } })['--on-danger-seed']).toBe('#ffffff')
    })

    it('ignores an unparseable colour instead of writing a broken ramp', () => {
        expect(brandColors.statusCssVariables({ statusColors: { danger: 'not-a-colour' } })).toEqual({})
    })
})

describe('brandColors.variableNames', () => {
    it('names every property the two writers can set', () => {
        const everything = {
            ...brandColors.cssVariables({ primaryColor: '#0ea5e9' }),
            ...brandColors.statusCssVariables({ statusColors: { danger: '#b91c1c', warning: '#facc15', success: '#16a34a' } }),
        }
        expect(brandColors.variableNames().sort()).toEqual(Object.keys(everything).sort())
    })
})

describe('brandColors.defaultRamp', () => {
    it('keeps the stock status steps', () => {
        expect(brandColors.defaultRamp({ scale: 'danger' }).light[11]).toBe('oklch(50.5% 0.213 27.52)')
        expect(brandColors.defaultRamp({ scale: 'warning' }).light[3]).toBe('oklch(96.2% 0.059 95.62)')
        expect(brandColors.defaultRamp({ scale: 'success' }).light[7]).toBe('oklch(87.1% 0.15 154.45)')
    })

    it('uses the default solids as step 9', () => {
        brandColors.statusScales.forEach((scale) => {
            expect(brandColors.defaultRamp({ scale }).light[9]).toBe(brandColors.defaultStatusColor({ scale }))
        })
        expect(brandColors.defaultRamp({ scale: 'accent' }).light[9]).toBe(brandColors.defaultPrimaryColor())
    })
})

describe('brandColors.ramp contrast', () => {
    const seeds = Array.from({ length: 36 }, (_, index) => index * 10).flatMap((hue) =>
        [0.06, 0.12, 0.2].flatMap((chroma) => [45, 60, 75, 90].map((lightness) => hexOf({ lightness, chroma, hue }))),
    )
    const scales = ['accent', ...brandColors.statusScales] as const

    it('keeps step 11 readable on every ground and on its own tint, in both themes, for any seed', () => {
        const failures = scales.flatMap((scale) =>
            seeds.flatMap((hex) => {
                const ramp = brandColors.ramp({ hex, scale })
                const light = [...LIGHT_GROUNDS.map(neutral), ramp.light[3]].filter((ground) => contrast({ first: ramp.light[11], second: ground }) < 4.5)
                const dark = [...DARK_GROUNDS.map(neutral), ramp.dark[3]].filter((ground) => contrast({ first: ramp.dark[11], second: ground }) < 4.5)
                return [...light, ...dark].map((ground) => `${scale} ${hex} on ${ground}`)
            }),
        )
        expect(failures).toEqual([])
    })

    it('keeps step 10 at 3:1 on the page in both themes, even for a pale seed', () => {
        const failures = scales.flatMap((scale) =>
            [...seeds, '#fde2e2', '#fffbe6', '#ffffff'].flatMap((hex) => {
                const ramp = brandColors.ramp({ hex, scale })
                const light = [100, 99.3, 98.2].map(neutral).filter((ground) => contrast({ first: ramp.light[10], second: ground }) < 3)
                const dark = [11, 16.2].map(neutral).filter((ground) => contrast({ first: ramp.dark[10], second: ground }) < 3)
                return [...light, ...dark].map((ground) => `${scale} ${hex} on ${ground}`)
            }),
        )
        expect(failures).toEqual([])
    })
})

describe('brandColors.swatches', () => {
    it('gives every chip a label that reads at 4.5:1 on its mark, in both themes', () => {
        const failures = brandColors.swatches().flatMap((swatch, index) =>
            (['light', 'dark'] as const)
                .filter((theme) => contrast({ first: swatch[theme].on, second: swatch[theme].mark }) < 4.5)
                .map((theme) => `swatch ${index + 1} ${theme}`),
        )
        expect(failures).toEqual([])
    })

    it('keeps swatch text readable on its own tint, in both themes', () => {
        const failures = brandColors.swatches().flatMap((swatch, index) =>
            (['light', 'dark'] as const)
                .filter((theme) => contrast({ first: swatch[theme].ink, second: swatch[theme].surface }) < 4.5)
                .map((theme) => `swatch ${index + 1} ${theme}`),
        )
        expect(failures).toEqual([])
    })
})

describe('brandColors.onPrimaryFor', () => {
    it('picks white on the default purple', () => {
        expect(brandColors.onPrimaryFor({ hex: '#6e41e2' })).toBe('#ffffff')
    })

    it('picks black on a bright yellow, where white measures 1.9:1', () => {
        expect(brandColors.onPrimaryFor({ hex: '#eab308' })).toBe('#000000')
    })
})

describe('brandColors.contrastRatio', () => {
    it('measures black on white at 21:1', () => {
        expect(brandColors.contrastRatio({ foreground: '#000000', background: '#ffffff' })).toBeCloseTo(21, 1)
    })

    it('reproduces the 5.97:1 that white on the default purple measures', () => {
        expect(brandColors.contrastRatio({ foreground: '#ffffff', background: '#6e41e2' })).toBeCloseTo(5.97, 1)
    })
})

function neutral(lightness: number): string {
    return `oklch(${lightness}% 0 0)`
}

function parse({ value }: { value: string }): { lightness: number, chroma: number, hue: number } {
    if (value.startsWith('#')) {
        const linear = [1, 3, 5].map((offset) => {
            const channel = parseInt(value.slice(offset, offset + 2), 16) / 255
            return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
        })
        const l = Math.cbrt(0.4122214708 * linear[0] + 0.5363325363 * linear[1] + 0.0514459929 * linear[2])
        const m = Math.cbrt(0.2119034982 * linear[0] + 0.6806995451 * linear[1] + 0.1073969566 * linear[2])
        const s = Math.cbrt(0.0883024619 * linear[0] + 0.2817188376 * linear[1] + 0.6299787005 * linear[2])
        return { lightness: (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * 100, chroma: 0, hue: 0 }
    }
    const match = value.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/)
    if (!match) {
        throw new Error(`not an oklch colour: ${value}`)
    }
    return { lightness: Number(match[1]), chroma: Number(match[2]), hue: Number(match[3]) }
}

function chromaOf({ value }: { value: string }): number {
    return parse({ value }).chroma
}

function hueOf({ value }: { value: string }): number {
    return parse({ value }).hue
}

function luminance({ value }: { value: string }): number {
    if (value.startsWith('#')) {
        const linear = [1, 3, 5].map((offset) => {
            const channel = parseInt(value.slice(offset, offset + 2), 16) / 255
            return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
    }
    const { r, g, b } = linearOf(parse({ value }))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function linearOf({ lightness, chroma, hue }: { lightness: number, chroma: number, hue: number }): { r: number, g: number, b: number } {
    const l0 = lightness / 100
    const a = chroma * Math.cos((hue * Math.PI) / 180)
    const b0 = chroma * Math.sin((hue * Math.PI) / 180)
    const l = Math.pow(l0 + 0.3963377774 * a + 0.2158037573 * b0, 3)
    const m = Math.pow(l0 - 0.1055613458 * a - 0.0638541728 * b0, 3)
    const s = Math.pow(l0 - 0.0894841775 * a - 1.291485548 * b0, 3)
    const clip = (channel: number) => Math.min(1, Math.max(0, channel))
    return {
        r: clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        g: clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        b: clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    }
}

function contrast({ first, second }: { first: string, second: string }): number {
    const [lighter, darker] = [luminance({ value: first }), luminance({ value: second })].sort((x, y) => y - x)
    return (lighter + 0.05) / (darker + 0.05)
}

function hexOf({ lightness, chroma, hue }: { lightness: number, chroma: number, hue: number }): string {
    const { r, g, b } = linearOf({ lightness, chroma, hue })
    const encode = (channel: number) => {
        const value = channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
        return Math.round(value * 255).toString(16).padStart(2, '0')
    }
    return `#${encode(r)}${encode(g)}${encode(b)}`
}
