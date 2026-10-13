const ACHROMATIC_CHROMA = 0.02
const MAX_CHROMA_RATIO = 1.25
const DEFAULT_ACCENT_SOLID = '#6e41e2'
const WHITE = '#ffffff'
const BLACK = '#000000'
const TEXT_CONTRAST = 4.5
const MARK_CONTRAST = 3
const LIGHTNESS_STEP = 0.5
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const LIGHT_GROUNDS = [100, 99.3, 98.2, 97, 95.5, 93.8]
const DARK_GROUNDS = [11, 16.2, 19.5, 23.5, 27.5]
const LIGHT_MARK_GROUNDS = [100, 99.3, 98.2]
const DARK_MARK_GROUNDS = [11, 16.2]
const LIGHT_SHADES: Record<RampStep, number> = { 1: 25, 2: 50, 3: 100, 4: 150, 5: 200, 6: 250, 7: 300, 8: 400, 9: 600, 10: 600, 11: 700, 12: 900 }
const DARK_SHADES: Record<RampStep, number> = { 1: 950, 2: 950, 3: 950, 4: 900, 5: 900, 6: 800, 7: 800, 8: 700, 9: 600, 10: 400, 11: 300, 12: 100 }
const DARK_SURFACES: Partial<Record<RampStep, { lightness: number, chromaShare: number }>> = {
    1: { lightness: 14, chromaShare: 0.35 },
    2: { lightness: 17, chromaShare: 0.5 },
    3: { lightness: 20.5, chromaShare: 0.6 },
    4: { lightness: 24, chromaShare: 0.65 },
    5: { lightness: 27.5, chromaShare: 0.7 },
    6: { lightness: 31, chromaShare: 0.72 },
    7: { lightness: 38, chromaShare: 0.75 },
    8: { lightness: 47, chromaShare: 0.8 },
}
const SCALE_ANCHORS: Record<RampScale, { family: ColorFamily, shade: number }> = {
    accent: { family: 'violet', shade: 600 },
    danger: { family: 'red', shade: 600 },
    warning: { family: 'amber', shade: 500 },
    success: { family: 'green', shade: 600 },
}

const STATUS_SCALES = ['danger', 'warning', 'success'] as const

const COLOR_FAMILIES: Record<ColorFamily, FamilyShade[]> = {
    red: [
        { shade: 50, lightness: 97.1, chroma: 0.013, hue: 17.38 },
        { shade: 100, lightness: 93.6, chroma: 0.032, hue: 17.717 },
        { shade: 200, lightness: 88.5, chroma: 0.062, hue: 18.334 },
        { shade: 300, lightness: 80.8, chroma: 0.114, hue: 19.571 },
        { shade: 400, lightness: 70.4, chroma: 0.191, hue: 22.216 },
        { shade: 500, lightness: 63.7, chroma: 0.237, hue: 25.331 },
        { shade: 600, lightness: 57.7, chroma: 0.245, hue: 27.325 },
        { shade: 700, lightness: 50.5, chroma: 0.213, hue: 27.518 },
        { shade: 800, lightness: 44.4, chroma: 0.177, hue: 26.899 },
        { shade: 900, lightness: 39.6, chroma: 0.141, hue: 25.723 },
        { shade: 950, lightness: 25.8, chroma: 0.092, hue: 26.042 },
    ],
    orange: [
        { shade: 50, lightness: 98.0, chroma: 0.016, hue: 73.684 },
        { shade: 100, lightness: 95.4, chroma: 0.038, hue: 75.164 },
        { shade: 200, lightness: 90.1, chroma: 0.076, hue: 70.697 },
        { shade: 300, lightness: 83.7, chroma: 0.128, hue: 66.29 },
        { shade: 400, lightness: 75.0, chroma: 0.183, hue: 55.934 },
        { shade: 500, lightness: 70.5, chroma: 0.213, hue: 47.604 },
        { shade: 600, lightness: 64.6, chroma: 0.222, hue: 41.116 },
        { shade: 700, lightness: 55.3, chroma: 0.195, hue: 38.402 },
        { shade: 800, lightness: 47.0, chroma: 0.157, hue: 37.304 },
        { shade: 900, lightness: 40.8, chroma: 0.123, hue: 38.172 },
        { shade: 950, lightness: 26.6, chroma: 0.079, hue: 36.259 },
    ],
    amber: [
        { shade: 50, lightness: 98.7, chroma: 0.022, hue: 95.277 },
        { shade: 100, lightness: 96.2, chroma: 0.059, hue: 95.617 },
        { shade: 200, lightness: 92.4, chroma: 0.12, hue: 95.746 },
        { shade: 300, lightness: 87.9, chroma: 0.169, hue: 91.605 },
        { shade: 400, lightness: 82.8, chroma: 0.189, hue: 84.429 },
        { shade: 500, lightness: 76.9, chroma: 0.188, hue: 70.08 },
        { shade: 600, lightness: 66.6, chroma: 0.179, hue: 58.318 },
        { shade: 700, lightness: 55.5, chroma: 0.163, hue: 48.998 },
        { shade: 800, lightness: 47.3, chroma: 0.137, hue: 46.201 },
        { shade: 900, lightness: 41.4, chroma: 0.112, hue: 45.904 },
        { shade: 950, lightness: 27.9, chroma: 0.077, hue: 45.635 },
    ],
    yellow: [
        { shade: 50, lightness: 98.7, chroma: 0.026, hue: 102.212 },
        { shade: 100, lightness: 97.3, chroma: 0.071, hue: 103.193 },
        { shade: 200, lightness: 94.5, chroma: 0.129, hue: 101.54 },
        { shade: 300, lightness: 90.5, chroma: 0.182, hue: 98.111 },
        { shade: 400, lightness: 85.2, chroma: 0.199, hue: 91.936 },
        { shade: 500, lightness: 79.5, chroma: 0.184, hue: 86.047 },
        { shade: 600, lightness: 68.1, chroma: 0.162, hue: 75.834 },
        { shade: 700, lightness: 55.4, chroma: 0.135, hue: 66.442 },
        { shade: 800, lightness: 47.6, chroma: 0.114, hue: 61.907 },
        { shade: 900, lightness: 42.1, chroma: 0.095, hue: 57.708 },
        { shade: 950, lightness: 28.6, chroma: 0.066, hue: 53.813 },
    ],
    lime: [
        { shade: 50, lightness: 98.6, chroma: 0.031, hue: 120.757 },
        { shade: 100, lightness: 96.7, chroma: 0.067, hue: 122.328 },
        { shade: 200, lightness: 93.8, chroma: 0.127, hue: 124.321 },
        { shade: 300, lightness: 89.7, chroma: 0.196, hue: 126.665 },
        { shade: 400, lightness: 84.1, chroma: 0.238, hue: 128.85 },
        { shade: 500, lightness: 76.8, chroma: 0.233, hue: 130.85 },
        { shade: 600, lightness: 64.8, chroma: 0.2, hue: 131.684 },
        { shade: 700, lightness: 53.2, chroma: 0.157, hue: 131.589 },
        { shade: 800, lightness: 45.3, chroma: 0.124, hue: 130.933 },
        { shade: 900, lightness: 40.5, chroma: 0.101, hue: 131.063 },
        { shade: 950, lightness: 27.4, chroma: 0.072, hue: 132.109 },
    ],
    green: [
        { shade: 50, lightness: 98.2, chroma: 0.018, hue: 155.826 },
        { shade: 100, lightness: 96.2, chroma: 0.044, hue: 156.743 },
        { shade: 200, lightness: 92.5, chroma: 0.084, hue: 155.995 },
        { shade: 300, lightness: 87.1, chroma: 0.15, hue: 154.449 },
        { shade: 400, lightness: 79.2, chroma: 0.209, hue: 151.711 },
        { shade: 500, lightness: 72.3, chroma: 0.219, hue: 149.579 },
        { shade: 600, lightness: 62.7, chroma: 0.194, hue: 149.214 },
        { shade: 700, lightness: 52.7, chroma: 0.154, hue: 150.069 },
        { shade: 800, lightness: 44.8, chroma: 0.119, hue: 151.328 },
        { shade: 900, lightness: 39.3, chroma: 0.095, hue: 152.535 },
        { shade: 950, lightness: 26.6, chroma: 0.065, hue: 152.934 },
    ],
    emerald: [
        { shade: 50, lightness: 97.9, chroma: 0.021, hue: 166.113 },
        { shade: 100, lightness: 95.0, chroma: 0.052, hue: 163.051 },
        { shade: 200, lightness: 90.5, chroma: 0.093, hue: 164.15 },
        { shade: 300, lightness: 84.5, chroma: 0.143, hue: 164.978 },
        { shade: 400, lightness: 76.5, chroma: 0.177, hue: 163.223 },
        { shade: 500, lightness: 69.6, chroma: 0.17, hue: 162.48 },
        { shade: 600, lightness: 59.6, chroma: 0.145, hue: 163.225 },
        { shade: 700, lightness: 50.8, chroma: 0.118, hue: 165.612 },
        { shade: 800, lightness: 43.2, chroma: 0.095, hue: 166.913 },
        { shade: 900, lightness: 37.8, chroma: 0.077, hue: 168.94 },
        { shade: 950, lightness: 26.2, chroma: 0.051, hue: 172.552 },
    ],
    teal: [
        { shade: 50, lightness: 98.4, chroma: 0.014, hue: 180.72 },
        { shade: 100, lightness: 95.3, chroma: 0.051, hue: 180.801 },
        { shade: 200, lightness: 91.0, chroma: 0.096, hue: 180.426 },
        { shade: 300, lightness: 85.5, chroma: 0.138, hue: 181.071 },
        { shade: 400, lightness: 77.7, chroma: 0.152, hue: 181.912 },
        { shade: 500, lightness: 70.4, chroma: 0.14, hue: 182.503 },
        { shade: 600, lightness: 60.0, chroma: 0.118, hue: 184.704 },
        { shade: 700, lightness: 51.1, chroma: 0.096, hue: 186.391 },
        { shade: 800, lightness: 43.7, chroma: 0.078, hue: 188.216 },
        { shade: 900, lightness: 38.6, chroma: 0.063, hue: 188.416 },
        { shade: 950, lightness: 27.7, chroma: 0.046, hue: 192.524 },
    ],
    cyan: [
        { shade: 50, lightness: 98.4, chroma: 0.019, hue: 200.873 },
        { shade: 100, lightness: 95.6, chroma: 0.045, hue: 203.388 },
        { shade: 200, lightness: 91.7, chroma: 0.08, hue: 205.041 },
        { shade: 300, lightness: 86.5, chroma: 0.127, hue: 207.078 },
        { shade: 400, lightness: 78.9, chroma: 0.154, hue: 211.53 },
        { shade: 500, lightness: 71.5, chroma: 0.143, hue: 215.221 },
        { shade: 600, lightness: 60.9, chroma: 0.126, hue: 221.723 },
        { shade: 700, lightness: 52.0, chroma: 0.105, hue: 223.128 },
        { shade: 800, lightness: 45.0, chroma: 0.085, hue: 224.283 },
        { shade: 900, lightness: 39.8, chroma: 0.07, hue: 227.392 },
        { shade: 950, lightness: 30.2, chroma: 0.056, hue: 229.695 },
    ],
    sky: [
        { shade: 50, lightness: 97.7, chroma: 0.013, hue: 236.62 },
        { shade: 100, lightness: 95.1, chroma: 0.026, hue: 236.824 },
        { shade: 200, lightness: 90.1, chroma: 0.058, hue: 230.902 },
        { shade: 300, lightness: 82.8, chroma: 0.111, hue: 230.318 },
        { shade: 400, lightness: 74.6, chroma: 0.16, hue: 232.661 },
        { shade: 500, lightness: 68.5, chroma: 0.169, hue: 237.323 },
        { shade: 600, lightness: 58.8, chroma: 0.158, hue: 241.966 },
        { shade: 700, lightness: 50.0, chroma: 0.134, hue: 242.749 },
        { shade: 800, lightness: 44.3, chroma: 0.11, hue: 240.79 },
        { shade: 900, lightness: 39.1, chroma: 0.09, hue: 240.876 },
        { shade: 950, lightness: 29.3, chroma: 0.066, hue: 243.157 },
    ],
    blue: [
        { shade: 50, lightness: 97.0, chroma: 0.014, hue: 254.604 },
        { shade: 100, lightness: 93.2, chroma: 0.032, hue: 255.585 },
        { shade: 200, lightness: 88.2, chroma: 0.059, hue: 254.128 },
        { shade: 300, lightness: 80.9, chroma: 0.105, hue: 251.813 },
        { shade: 400, lightness: 70.7, chroma: 0.165, hue: 254.624 },
        { shade: 500, lightness: 62.3, chroma: 0.214, hue: 259.815 },
        { shade: 600, lightness: 54.6, chroma: 0.245, hue: 262.881 },
        { shade: 700, lightness: 48.8, chroma: 0.243, hue: 264.376 },
        { shade: 800, lightness: 42.4, chroma: 0.199, hue: 265.638 },
        { shade: 900, lightness: 37.9, chroma: 0.146, hue: 265.522 },
        { shade: 950, lightness: 28.2, chroma: 0.091, hue: 267.935 },
    ],
    indigo: [
        { shade: 50, lightness: 96.2, chroma: 0.018, hue: 272.314 },
        { shade: 100, lightness: 93.0, chroma: 0.034, hue: 272.788 },
        { shade: 200, lightness: 87.0, chroma: 0.065, hue: 274.039 },
        { shade: 300, lightness: 78.5, chroma: 0.115, hue: 274.713 },
        { shade: 400, lightness: 67.3, chroma: 0.182, hue: 276.935 },
        { shade: 500, lightness: 58.5, chroma: 0.233, hue: 277.117 },
        { shade: 600, lightness: 51.1, chroma: 0.262, hue: 276.966 },
        { shade: 700, lightness: 45.7, chroma: 0.24, hue: 277.023 },
        { shade: 800, lightness: 39.8, chroma: 0.195, hue: 277.366 },
        { shade: 900, lightness: 35.9, chroma: 0.144, hue: 278.697 },
        { shade: 950, lightness: 25.7, chroma: 0.09, hue: 281.288 },
    ],
    violet: [
        { shade: 50, lightness: 96.9, chroma: 0.016, hue: 293.756 },
        { shade: 100, lightness: 94.3, chroma: 0.029, hue: 294.588 },
        { shade: 200, lightness: 89.4, chroma: 0.057, hue: 293.283 },
        { shade: 300, lightness: 81.1, chroma: 0.111, hue: 293.571 },
        { shade: 400, lightness: 70.2, chroma: 0.183, hue: 293.541 },
        { shade: 500, lightness: 60.6, chroma: 0.25, hue: 292.717 },
        { shade: 600, lightness: 54.1, chroma: 0.281, hue: 293.009 },
        { shade: 700, lightness: 49.1, chroma: 0.27, hue: 292.581 },
        { shade: 800, lightness: 43.2, chroma: 0.232, hue: 292.759 },
        { shade: 900, lightness: 38.0, chroma: 0.189, hue: 293.745 },
        { shade: 950, lightness: 28.3, chroma: 0.141, hue: 291.089 },
    ],
    purple: [
        { shade: 50, lightness: 97.7, chroma: 0.014, hue: 308.299 },
        { shade: 100, lightness: 94.6, chroma: 0.033, hue: 307.174 },
        { shade: 200, lightness: 90.2, chroma: 0.063, hue: 306.703 },
        { shade: 300, lightness: 82.7, chroma: 0.119, hue: 306.383 },
        { shade: 400, lightness: 71.4, chroma: 0.203, hue: 305.504 },
        { shade: 500, lightness: 62.7, chroma: 0.265, hue: 303.9 },
        { shade: 600, lightness: 55.8, chroma: 0.288, hue: 302.321 },
        { shade: 700, lightness: 49.6, chroma: 0.265, hue: 301.924 },
        { shade: 800, lightness: 43.8, chroma: 0.218, hue: 303.724 },
        { shade: 900, lightness: 38.1, chroma: 0.176, hue: 304.987 },
        { shade: 950, lightness: 29.1, chroma: 0.149, hue: 302.717 },
    ],
    fuchsia: [
        { shade: 50, lightness: 97.7, chroma: 0.017, hue: 320.058 },
        { shade: 100, lightness: 95.2, chroma: 0.037, hue: 318.852 },
        { shade: 200, lightness: 90.3, chroma: 0.076, hue: 319.62 },
        { shade: 300, lightness: 83.3, chroma: 0.145, hue: 321.434 },
        { shade: 400, lightness: 74.0, chroma: 0.238, hue: 322.16 },
        { shade: 500, lightness: 66.7, chroma: 0.295, hue: 322.15 },
        { shade: 600, lightness: 59.1, chroma: 0.293, hue: 322.896 },
        { shade: 700, lightness: 51.8, chroma: 0.253, hue: 323.949 },
        { shade: 800, lightness: 45.2, chroma: 0.211, hue: 324.591 },
        { shade: 900, lightness: 40.1, chroma: 0.17, hue: 325.612 },
        { shade: 950, lightness: 29.3, chroma: 0.136, hue: 325.661 },
    ],
    pink: [
        { shade: 50, lightness: 97.1, chroma: 0.014, hue: 343.198 },
        { shade: 100, lightness: 94.8, chroma: 0.028, hue: 342.258 },
        { shade: 200, lightness: 89.9, chroma: 0.061, hue: 343.231 },
        { shade: 300, lightness: 82.3, chroma: 0.12, hue: 346.018 },
        { shade: 400, lightness: 71.8, chroma: 0.202, hue: 349.761 },
        { shade: 500, lightness: 65.6, chroma: 0.241, hue: 354.308 },
        { shade: 600, lightness: 59.2, chroma: 0.249, hue: 0.584 },
        { shade: 700, lightness: 52.5, chroma: 0.223, hue: 3.958 },
        { shade: 800, lightness: 45.9, chroma: 0.187, hue: 3.815 },
        { shade: 900, lightness: 40.8, chroma: 0.153, hue: 2.432 },
        { shade: 950, lightness: 28.4, chroma: 0.109, hue: 3.907 },
    ],
    rose: [
        { shade: 50, lightness: 96.9, chroma: 0.015, hue: 12.422 },
        { shade: 100, lightness: 94.1, chroma: 0.03, hue: 12.58 },
        { shade: 200, lightness: 89.2, chroma: 0.058, hue: 10.001 },
        { shade: 300, lightness: 81.0, chroma: 0.117, hue: 11.638 },
        { shade: 400, lightness: 71.2, chroma: 0.194, hue: 13.428 },
        { shade: 500, lightness: 64.5, chroma: 0.246, hue: 16.439 },
        { shade: 600, lightness: 58.6, chroma: 0.253, hue: 17.585 },
        { shade: 700, lightness: 51.4, chroma: 0.222, hue: 16.935 },
        { shade: 800, lightness: 45.5, chroma: 0.188, hue: 13.697 },
        { shade: 900, lightness: 41.0, chroma: 0.159, hue: 10.272 },
        { shade: 950, lightness: 27.1, chroma: 0.105, hue: 12.094 },
    ],
}

const SWATCH_FAMILIES: ColorFamily[] = ['purple', 'fuchsia', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'emerald', 'cyan', 'blue', 'indigo']
const LIGHT_SWATCH_MARKS: SwatchCandidate[] = [
    { shade: 500, chromaShare: 1 },
    { shade: 600, chromaShare: 1 },
    { shade: 700, chromaShare: 1 },
]
const DARK_SWATCH_MARKS: SwatchCandidate[] = [
    { shade: 500, chromaShare: 0.85 },
    { shade: 400, chromaShare: 0.85 },
    { shade: 300, chromaShare: 0.85 },
]

const COLOR_FAMILY_NAMES: ColorFamily[] = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']

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
    const solid = parseHex(primaryColor) === null ? DEFAULT_ACCENT_SOLID : withHash({ hex: primaryColor })
    const generated = ramp({ hex: solid, scale: 'accent' })
    return {
        ...rampVariables({ scale: 'accent', generated }),
        '--on-accent': generated.onSolid,
    }
}

function statusCssVariables({
    statusColors,
}: {
    statusColors: StatusColors
}): Record<string, string> {
    return Object.fromEntries(
        STATUS_SCALES.flatMap((scale) => {
            const hex = statusColors[scale]
            if (hex === undefined || parseHex(hex) === null) {
                return []
            }
            const generated = ramp({ hex: withHash({ hex }), scale })
            return [
                ...Object.entries(rampVariables({ scale, generated })),
                [`--on-${scale}-seed`, generated.onSolid],
            ]
        }),
    )
}

function variableNames(): string[] {
    const scales: RampScale[] = ['accent', ...STATUS_SCALES]
    return [
        ...scales.flatMap((scale) => STEPS.flatMap((step) => [`--${scale}-light-${step}`, `--${scale}-dark-${step}`])),
        '--on-accent',
        ...STATUS_SCALES.map((scale) => `--on-${scale}-seed`),
    ]
}

function defaultPrimaryColor(): string {
    return DEFAULT_ACCENT_SOLID
}

function defaultStatusColor({ scale }: { scale: StatusScale }): string {
    return anchorHex({ scale })
}

function defaultRamp({ scale }: { scale: RampScale }): Ramp {
    return ramp({ hex: scale === 'accent' ? DEFAULT_ACCENT_SOLID : anchorHex({ scale }), scale })
}

function ramp({ hex, scale }: { hex: string, scale: RampScale }): Ramp {
    const parsed = parseHex(hex) ?? parseHex(DEFAULT_ACCENT_SOLID)
    const seed = srgbToOklchFull(parsed ?? { r: 0, g: 0, b: 0 })
    const achromatic = seed.chroma < ACHROMATIC_CHROMA
    return familyRamp({
        hex,
        family: achromatic ? SCALE_ANCHORS[scale].family : nearestFamily({ hue: seed.hue }),
        anchorShade: SCALE_ANCHORS[scale].shade,
        exact: scale !== 'accent' && hex.toLowerCase() === anchorHex({ scale }),
    })
}

function familyRamp({
    hex,
    family,
    anchorShade,
    exact,
}: {
    hex: string
    family: ColorFamily
    anchorShade: number
    exact: boolean
}): Ramp {
    const seed = srgbToOklchFull(parseHex(hex) ?? { r: 0, g: 0, b: 0 })
    const achromatic = seed.chroma < ACHROMATIC_CHROMA
    const anchor = shadeOf({ family, shade: anchorShade })
    const isAnchor = exact
    const chromaRatio = isAnchor ? 1 : achromatic ? 0 : clamp({ value: seed.chroma / anchor.chroma, min: 0, max: MAX_CHROMA_RATIO })
    const hueShift = isAnchor || achromatic ? 0 : seed.hue - anchor.hue
    const build = ({ shades, theme }: { shades: Record<RampStep, number>, theme: RampTheme }): Record<RampStep, string> => {
        const base = byStep((step) => {
            const shade = shadeOf({ family, shade: shades[step] })
            const surface = theme === 'dark' ? DARK_SURFACES[step] : undefined
            return {
                lightness: surface?.lightness ?? shade.lightness,
                chroma: shade.chroma * chromaRatio * (surface?.chromaShare ?? 1),
                hue: normaliseHue({ hue: shade.hue + hueShift }),
            }
        })
        const tint = base[3]
        const text = readable({ color: base[11], grounds: [...groundsFor({ theme }), tint], minimum: TEXT_CONTRAST, theme })
        const mark = readable({ color: base[10], grounds: markGroundsFor({ theme }), minimum: MARK_CONTRAST, theme })
        return byStep((step) => {
            if (step === 9) {
                return hex
            }
            return formatOklch({ color: step === 11 ? text : step === 10 ? mark : base[step] })
        })
    }
    return {
        light: build({ shades: LIGHT_SHADES, theme: 'light' }),
        dark: build({ shades: DARK_SHADES, theme: 'dark' }),
        onSolid: onPrimaryFor({ hex }),
    }
}

function byStep<T>(make: (step: RampStep) => T): Record<RampStep, T> {
    return {
        1: make(1), 2: make(2), 3: make(3), 4: make(4), 5: make(5), 6: make(6),
        7: make(7), 8: make(8), 9: make(9), 10: make(10), 11: make(11), 12: make(12),
    }
}

function swatches(): Swatch[] {
    return SWATCH_FAMILIES.map((family) => {
        const generated = familyRamp({ hex: oklchToHex({ color: shadeOf({ family, shade: 500 }) }), family, anchorShade: 500, exact: true })
        const deepest = shadeOf({ family, shade: 950 })
        return {
            light: {
                ...swatchMark({ family, candidates: LIGHT_SWATCH_MARKS, deepest }),
                surface: generated.light[3],
                line: generated.light[5],
                ink: generated.light[11],
            },
            dark: {
                ...swatchMark({ family, candidates: DARK_SWATCH_MARKS, deepest }),
                surface: generated.dark[3],
                line: generated.dark[7],
                ink: generated.dark[11],
            },
        }
    })
}

function swatchMark({
    family,
    candidates,
    deepest,
}: {
    family: ColorFamily
    candidates: SwatchCandidate[]
    deepest: OklchColor
}): { mark: string, on: string } {
    const white: OklchColor = { lightness: 100, chroma: 0, hue: 0 }
    const options = candidates.map((candidate) => {
        const shade = shadeOf({ family, shade: candidate.shade })
        const mark = { ...shade, chroma: shade.chroma * candidate.chromaShare }
        const label = luminanceContrast({ first: white, second: mark }) >= luminanceContrast({ first: deepest, second: mark }) ? white : deepest
        return { mark, label, contrast: luminanceContrast({ first: label, second: mark }) }
    })
    const chosen = options.find((option) => option.contrast >= TEXT_CONTRAST) ?? options[options.length - 1]
    return {
        mark: formatOklch({ color: chosen.mark }),
        on: chosen.label === white ? WHITE : formatOklch({ color: chosen.label }),
    }
}

function rampVariables({ scale, generated }: { scale: RampScale, generated: Ramp }): Record<string, string> {
    return Object.fromEntries(
        STEPS.flatMap((step) => [
            [`--${scale}-light-${step}`, generated.light[step]],
            [`--${scale}-dark-${step}`, generated.dark[step]],
        ]),
    )
}

function readable({
    color,
    grounds,
    minimum,
    theme,
}: {
    color: OklchColor
    grounds: OklchColor[]
    minimum: number
    theme: RampTheme
}): OklchColor {
    const direction = theme === 'light' ? -LIGHTNESS_STEP : LIGHTNESS_STEP
    const passes = (candidate: OklchColor): boolean =>
        grounds.every((ground) => luminanceContrast({ first: candidate, second: ground }) >= minimum)
    const attempt = (candidate: OklchColor): OklchColor =>
        passes(candidate) || candidate.lightness <= 0 || candidate.lightness >= 100
            ? candidate
            : attempt({ ...candidate, lightness: candidate.lightness + direction })
    return attempt(color)
}

function groundsFor({ theme }: { theme: RampTheme }): OklchColor[] {
    return (theme === 'light' ? LIGHT_GROUNDS : DARK_GROUNDS).map((lightness) => ({ lightness, chroma: 0, hue: 0 }))
}

function markGroundsFor({ theme }: { theme: RampTheme }): OklchColor[] {
    return (theme === 'light' ? LIGHT_MARK_GROUNDS : DARK_MARK_GROUNDS).map((lightness) => ({ lightness, chroma: 0, hue: 0 }))
}

function nearestFamily({ hue }: { hue: number }): ColorFamily {
    return COLOR_FAMILY_NAMES.reduce<ColorFamily>((best, family) =>
        hueDistance({ first: shadeOf({ family, shade: 500 }).hue, second: hue }) <
        hueDistance({ first: shadeOf({ family: best, shade: 500 }).hue, second: hue })
            ? family
            : best,
    COLOR_FAMILY_NAMES[0])
}

function shadeOf({ family, shade }: { family: ColorFamily, shade: number }): OklchColor {
    const shades: FamilyShade[] = [
        { shade: 0, lightness: 100, chroma: 0, hue: COLOR_FAMILIES[family][0].hue },
        ...COLOR_FAMILIES[family],
    ]
    const exact = shades.find((entry) => entry.shade === shade)
    if (exact) {
        return { lightness: exact.lightness, chroma: exact.chroma, hue: exact.hue }
    }
    const upper = shades.find((entry) => entry.shade > shade) ?? shades[shades.length - 1]
    const lower = [...shades].reverse().find((entry) => entry.shade < shade) ?? shades[0]
    const progress = (shade - lower.shade) / (upper.shade - lower.shade)
    const nearer = progress < 0.5 ? lower : upper
    return {
        lightness: lower.lightness + (upper.lightness - lower.lightness) * progress,
        chroma: lower.chroma + (upper.chroma - lower.chroma) * progress,
        hue: nearer.chroma === 0 ? (progress < 0.5 ? upper.hue : lower.hue) : nearer.hue,
    }
}

function anchorHex({ scale }: { scale: RampScale }): string {
    return oklchToHex({ color: shadeOf(SCALE_ANCHORS[scale]) })
}

function hueDistance({ first, second }: { first: number, second: number }): number {
    const difference = Math.abs(first - second) % 360
    return difference > 180 ? 360 - difference : difference
}

function normaliseHue({ hue }: { hue: number }): number {
    return ((hue % 360) + 360) % 360
}

function formatOklch({ color }: { color: OklchColor }): string {
    return `oklch(${round({ value: color.lightness, places: 2 })}% ${round({ value: color.chroma, places: 4 })} ${round({ value: color.hue, places: 2 })})`
}

function oklchToLinear({ color }: { color: OklchColor }): Srgb {
    const lightness = color.lightness / 100
    const a = color.chroma * Math.cos((color.hue * Math.PI) / 180)
    const b = color.chroma * Math.sin((color.hue * Math.PI) / 180)
    const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3)
    const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3)
    const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3)
    return {
        r: clamp({ value: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, min: 0, max: 1 }),
        g: clamp({ value: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, min: 0, max: 1 }),
        b: clamp({ value: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s, min: 0, max: 1 }),
    }
}

function luminanceContrast({ first, second }: { first: OklchColor, second: OklchColor }): number {
    const luminance = (color: OklchColor): number => {
        const { r, g, b } = oklchToLinear({ color })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const [lighter, darker] = [luminance(first), luminance(second)].sort((x, y) => y - x)
    return (lighter + 0.05) / (darker + 0.05)
}

function oklchToHex({ color }: { color: OklchColor }): string {
    const { r, g, b } = oklchToLinear({ color })
    const encode = (channel: number): string => {
        const value = channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
        return Math.round(clamp({ value, min: 0, max: 1 }) * 255).toString(16).padStart(2, '0')
    }
    return `#${encode(r)}${encode(g)}${encode(b)}`
}

function srgbToOklchFull(srgb: Srgb): OklchColor {
    const lr = toLinear(srgb.r)
    const lg = toLinear(srgb.g)
    const lb = toLinear(srgb.b)
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
    const { chroma, hue } = srgbToOklch(srgb)
    return { lightness: (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * 100, chroma, hue }
}

export const brandColors = {
    statusScales: STATUS_SCALES,
    steps: STEPS,
    cssVariables,
    statusCssVariables,
    variableNames,
    defaultPrimaryColor,
    defaultStatusColor,
    defaultRamp,
    ramp,
    swatches,
    contrastRatio,
    onPrimaryFor,
}

export type StatusScale = (typeof STATUS_SCALES)[number]

export type StatusColors = Partial<Record<StatusScale, string>>

type Srgb = {
    r: number
    g: number
    b: number
}

type Oklch = {
    chroma: number
    hue: number
}

type OklchColor = {
    lightness: number
    chroma: number
    hue: number
}

type RampScale = 'accent' | StatusScale

type RampTheme = 'light' | 'dark'

type RampStep = (typeof STEPS)[number]

type Ramp = {
    light: Record<RampStep, string>
    dark: Record<RampStep, string>
    onSolid: string
}

type ColorFamily = 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'

type FamilyShade = {
    shade: number
    lightness: number
    chroma: number
    hue: number
}

type SwatchCandidate = {
    shade: number
    chromaShare: number
}

type SwatchRoles = {
    mark: string
    on: string
    surface: string
    line: string
    ink: string
}

type Swatch = {
    light: SwatchRoles
    dark: SwatchRoles
}
