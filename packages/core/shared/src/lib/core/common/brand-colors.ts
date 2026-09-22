const PRIMARY_CURVE: RampStep[] = [
    { step: '50', lightness: 96.9, chroma: 0.016 },
    { step: '100', lightness: 94.3, chroma: 0.029 },
    { step: '200', lightness: 89.4, chroma: 0.057 },
    { step: '300', lightness: 81.1, chroma: 0.111 },
    { step: '400', lightness: 70.2, chroma: 0.183 },
    { step: '500', lightness: 60.6, chroma: 0.25 },
    { step: '600', lightness: 54.1, chroma: 0.281 },
    { step: '700', lightness: 49.1, chroma: 0.27 },
    { step: '800', lightness: 43.2, chroma: 0.232 },
    { step: '900', lightness: 38.0, chroma: 0.189 },
    { step: '950', lightness: 28.3, chroma: 0.141 },
]

const INK_CURVE_LIGHT: RampStep[] = [
    { step: '50', lightness: 98.4, chroma: 0.003 },
    { step: '100', lightness: 96.8, chroma: 0.007 },
    { step: '150', lightness: 94.6, chroma: 0.005 },
    { step: '200', lightness: 92.9, chroma: 0.013 },
    { step: '300', lightness: 86.9, chroma: 0.022 },
    { step: '400', lightness: 70.4, chroma: 0.04 },
    { step: '500', lightness: 51.5, chroma: 0.046 },
    { step: '600', lightness: 44.6, chroma: 0.043 },
    { step: '700', lightness: 37.2, chroma: 0.044 },
    { step: '800', lightness: 27.9, chroma: 0.041 },
    { step: '900', lightness: 20.8, chroma: 0.036 },
    { step: '950', lightness: 12.9, chroma: 0.023 },
]

const INK_CURVE_DARK: RampStep[] = [
    { step: '50', lightness: 17, chroma: 0.012 },
    { step: '100', lightness: 21, chroma: 0.014 },
    { step: '150', lightness: 25, chroma: 0.014 },
    { step: '200', lightness: 29, chroma: 0.015 },
    { step: '300', lightness: 38, chroma: 0.018 },
    { step: '400', lightness: 56, chroma: 0.028 },
    { step: '500', lightness: 68, chroma: 0.031 },
    { step: '600', lightness: 77, chroma: 0.028 },
    { step: '700', lightness: 85, chroma: 0.022 },
    { step: '800', lightness: 91, chroma: 0.016 },
    { step: '900', lightness: 96, chroma: 0.008 },
    { step: '950', lightness: 99, chroma: 0.003 },
]

const REFERENCE_CHROMA = 0.2281
const MIN_CHROMA_SCALE = 0.35
const MAX_CHROMA_SCALE = 1.25
const CANVAS_LIGHTNESS_LIGHT = 98.8
const CANVAS_CHROMA_LIGHT = 0.002
const WHITE = '#ffffff'
const BLACK = '#000000'

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function parseHex(hex: string): Srgb | null {
    const cleaned = hex.trim().replace(/^#/, '')
    const expanded =
        cleaned.length === 3
            ? cleaned
                .split('')
                .map((char) => char + char)
                .join('')
            : cleaned
    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
        return null
    }
    return {
        r: parseInt(expanded.slice(0, 2), 16) / 255,
        g: parseInt(expanded.slice(2, 4), 16) / 255,
        b: parseInt(expanded.slice(4, 6), 16) / 255,
    }
}

function toLinear(channel: number): number {
    return channel <= 0.04045
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
}

function srgbToOklch({ r, g, b }: Srgb): Oklch {
    const lr = toLinear(r)
    const lg = toLinear(g)
    const lb = toLinear(b)

    const l = Math.cbrt(
        0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
    )
    const m = Math.cbrt(
        0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
    )
    const s = Math.cbrt(
        0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
    )

    const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

    const hue = (Math.atan2(bAxis, a) * 180) / Math.PI

    return {
        lightness: lightness * 100,
        chroma: Math.sqrt(a * a + bAxis * bAxis),
        hue: hue < 0 ? hue + 360 : hue,
    }
}

function relativeLuminance({ r, g, b }: Srgb): number {
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function formatOklch({ lightness, chroma, hue }: Oklch): string {
    return `oklch(${round(lightness, 2)}% ${round(chroma, 4)} ${round(hue, 2)})`
}

function round(value: number, places: number): number {
    const factor = Math.pow(10, places)
    return Math.round(value * factor) / factor
}

function rampVariables({
    prefix,
    curve,
    hue,
    chromaScale,
}: {
    prefix: string
    curve: RampStep[]
    hue: number
    chromaScale: number
}): Record<string, string> {
    return curve.reduce<Record<string, string>>((variables, entry) => {
        return {
            ...variables,
            [`--${prefix}-${entry.step}`]: formatOklch({
                lightness: entry.lightness,
                chroma: entry.chroma * chromaScale,
                hue,
            }),
        }
    }, {})
}

function contrastRatio({
    foreground,
    background,
}: {
    foreground: string
    background: string
}): number {
    const first = parseHex(foreground)
    const second = parseHex(background)
    if (first === null || second === null) {
        return 1
    }
    const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
    const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
    return (lighter + 0.05) / (darker + 0.05)
}

function onPrimaryFor({ hex }: { hex: string }): string {
    const onWhite = contrastRatio({ foreground: WHITE, background: hex })
    const onBlack = contrastRatio({ foreground: BLACK, background: hex })
    return onWhite >= onBlack ? WHITE : BLACK
}

function cssVariables({
    primaryColor,
    theme,
}: {
    primaryColor: string
    theme: BrandTheme
}): Record<string, string> {
    const parsed = parseHex(primaryColor)
    if (parsed === null) {
        return {}
    }

    const { chroma, hue } = srgbToOklch(parsed)
    const chromaScale = clamp(
        chroma / REFERENCE_CHROMA,
        MIN_CHROMA_SCALE,
        MAX_CHROMA_SCALE,
    )

    const inkVariables = rampVariables({
        prefix: 'ink',
        curve: theme === 'dark' ? INK_CURVE_DARK : INK_CURVE_LIGHT,
        hue,
        chromaScale: 1,
    })

    const primaryVariables = rampVariables({
        prefix: 'primary',
        curve: PRIMARY_CURVE,
        hue,
        chromaScale,
    })

    const canvas: Record<string, string> =
        theme === 'dark'
            ? {}
            : {
                '--canvas': formatOklch({
                    lightness: CANVAS_LIGHTNESS_LIGHT,
                    chroma: CANVAS_CHROMA_LIGHT,
                    hue,
                }),
            }

    return {
        ...inkVariables,
        ...primaryVariables,
        ...canvas,
        '--primary': primaryColor,
        '--on-primary': onPrimaryFor({ hex: primaryColor }),
    }
}

export const brandColors = {
    cssVariables,
    contrastRatio,
    onPrimaryFor,
}

export type BrandTheme = 'light' | 'dark'

type RampStep = {
    step: string
    lightness: number
    chroma: number
}

type Srgb = {
    r: number
    g: number
    b: number
}

type Oklch = {
    lightness: number
    chroma: number
    hue: number
}
