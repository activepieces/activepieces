const SWATCH_COUNT = 12

function hashToIndex({ seed }: { seed: string }): number {
    let hash = 0
    for (let position = 0; position < seed.length; position++) {
        hash = (hash << 5) - hash + seed.charCodeAt(position)
        hash |= 0
    }
    return Math.abs(hash) % SWATCH_COUNT
}

function varsFor({ index }: { index: number }): SwatchVars {
    const slot = (((index % SWATCH_COUNT) + SWATCH_COUNT) % SWATCH_COUNT) + 1
    return {
        mark: `var(--swatch-${slot}-mark)`,
        on: `var(--swatch-${slot}-on)`,
        surface: `var(--swatch-${slot}-surface)`,
        ink: `var(--swatch-${slot}-ink)`,
        line: `var(--swatch-${slot}-line)`,
    }
}

function varsForSeed({ seed }: { seed: string }): SwatchVars {
    return varsFor({ index: hashToIndex({ seed }) })
}

export const swatchUtils = {
    hashToIndex,
    varsFor,
    varsForSeed,
}

export const CATEGORICAL_SWATCH_COUNT = SWATCH_COUNT

export type SwatchVars = {
    mark: string
    on: string
    surface: string
    ink: string
    line: string
}
