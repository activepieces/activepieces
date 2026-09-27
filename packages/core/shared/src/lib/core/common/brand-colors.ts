const REFERENCE_CHROMA = 0.2281
const MIN_CHROMA_SCALE = 0.4
const MAX_CHROMA_SCALE = 1
const ACHROMATIC_CHROMA = 0.02
const DEFAULT_BRAND_HUE = 288.86
const DEFAULT_ACCENT_SOLID = '#6e41e2'
const WHITE = '#ffffff'
const BLACK = '#000000'
const AA_TEXT_RATIO = 4.5

export const brandColors = {
    cssVariables,
    contrastRatio,
    onPrimaryFor,
    describeContrast,
}

function clamp({ value, min, max }: { value: number, min: number, max: number }): number {
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

    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

    const hue = (Math.atan2(bAxis, a) * 180) / Math.PI

    return {
        chroma: Math.sqrt(a * a + bAxis * bAxis),
        hue: hue < 0 ? hue + 360 : hue,
    }
}

function relativeLuminance({ r, g, b }: Srgb): number {
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function round({ value, places }: { value: number, places: number }): number {
    const factor = Math.pow(10, places)
    return Math.round(value * factor) / factor
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

function withHash({ hex }: { hex: string }): string {
    const trimmed = hex.trim()
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

function onPrimaryFor({ hex }: { hex: string }): string {
    const onWhite = contrastRatio({ foreground: WHITE, background: hex })
    const onBlack = contrastRatio({ foreground: BLACK, background: hex })
    return onWhite >= onBlack ? WHITE : BLACK
}

function cssVariables({
    primaryColor,
}: {
    primaryColor: string
}): Record<string, string> {
    const parsed = parseHex(primaryColor)
    if (parsed === null) {
        return {
            '--brand-h': String(DEFAULT_BRAND_HUE),
            '--brand-c': '1',
            '--accent-9': DEFAULT_ACCENT_SOLID,
            '--on-accent': onPrimaryFor({ hex: DEFAULT_ACCENT_SOLID }),
        }
    }

    const solid = withHash({ hex: primaryColor })
    const { chroma, hue } = srgbToOklch(parsed)
    if (chroma < ACHROMATIC_CHROMA) {
        return {
            '--brand-h': String(DEFAULT_BRAND_HUE),
            '--brand-c': '0',
            '--accent-9': solid,
            '--on-accent': onPrimaryFor({ hex: solid }),
        }
    }
    return {
        '--brand-h': String(round({ value: hue, places: 2 })),
        '--brand-c': String(
            round({
                value: clamp({
                    value: chroma / REFERENCE_CHROMA,
                    min: MIN_CHROMA_SCALE,
                    max: MAX_CHROMA_SCALE,
                }),
                places: 4,
            }),
        ),
        '--accent-9': solid,
        '--on-accent': onPrimaryFor({ hex: solid }),
    }
}

function describeContrast({ hex }: { hex: string }): ContrastReport {
    const onWhite = contrastRatio({ foreground: WHITE, background: hex })
    const onBlack = contrastRatio({ foreground: BLACK, background: hex })
    return {
        onWhite,
        onBlack,
        best: Math.max(onWhite, onBlack),
        passesText: Math.max(onWhite, onBlack) >= AA_TEXT_RATIO,
    }
}

export type ContrastReport = {
    onWhite: number
    onBlack: number
    best: number
    passesText: boolean
}

type Srgb = {
    r: number
    g: number
    b: number
}

type Oklch = {
    chroma: number
    hue: number
}
