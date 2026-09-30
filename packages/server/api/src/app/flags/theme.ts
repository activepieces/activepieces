import { isNil } from '@activepieces/core-utils'
import { PlatformThemeColors, StatusColors, StatusScale } from '@activepieces/shared'
import tinycolor from 'tinycolor2'

const LEGACY_STATUS_COLORS: Record<StatusScale, string> = {
    danger: '#f94949',
    warning: '#f78a3b',
    success: '#14ae5c',
}

function generateColorVariations(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)

    const darkColor = defaultColorObj.clone().darken(2)
    const baseLight = tinycolor('#ffffff')
    const lightColor = tinycolor
        .mix(baseLight, defaultColorObj.toHex(), 12)
        .toHexString()
    const mediumColor = defaultColorObj.clone().lighten(26)

    return {
        default: defaultColorObj.toHexString(),
        dark: darkColor.toHexString(),
        light: lightColor,
        medium: mediumColor.toHexString(),
    }
}

function generateSelectionColor(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)
    const lightColor = defaultColorObj.lighten(8)
    return lightColor.toHexString()
}

export function generateTheme({
    primaryColor,
    fullLogoUrl,
    favIconUrl,
    logoIconUrl,
    websiteName,
    themeColors,
}: {
    primaryColor: string
    fullLogoUrl: string
    favIconUrl: string
    logoIconUrl: string
    websiteName: string
    themeColors?: PlatformThemeColors
}) {
    const primary = generateColorVariations(primaryColor)
    return {
        websiteName,
        colors: {
            avatar: themeColors?.avatar ?? '#515151',
            'blue-link': themeColors?.['blue-link'] ?? '#1890ff',
            danger: themeColors?.danger ?? LEGACY_STATUS_COLORS.danger,
            primary: {
                default: primary.default,
                dark: themeColors?.primary?.dark ?? primary.dark,
                light: themeColors?.primary?.light ?? primary.light,
                medium: themeColors?.primary?.medium ?? primary.medium,
            },
            warn: {
                default: themeColors?.warn?.default ?? LEGACY_STATUS_COLORS.warning,
                light: themeColors?.warn?.light ?? '#fff6e4',
                dark: themeColors?.warn?.dark ?? '#cc8805',
            },
            success: {
                default: themeColors?.success?.default ?? LEGACY_STATUS_COLORS.success,
                light: themeColors?.success?.light ?? '#3cad71',
            },
            selection: themeColors?.selection ?? generateSelectionColor(primaryColor),
        },
        statusColors: chosenStatusColors({ themeColors }),
        logos: {
            fullLogoUrl,
            favIconUrl,
            logoIconUrl,
        },
    }
}

function chosenStatusColors({ themeColors }: { themeColors?: PlatformThemeColors }): StatusColors {
    const savedByLegacyForm = !isNil(themeColors?.avatar)
    return {
        ...chosenStatusColor({ scale: 'danger', hex: themeColors?.danger, savedByLegacyForm }),
        ...chosenStatusColor({ scale: 'warning', hex: themeColors?.warn?.default, savedByLegacyForm }),
        ...chosenStatusColor({ scale: 'success', hex: themeColors?.success?.default, savedByLegacyForm }),
    }
}

function chosenStatusColor({ scale, hex, savedByLegacyForm }: { scale: StatusScale, hex: string | undefined, savedByLegacyForm: boolean }): StatusColors {
    if (isNil(hex)) {
        return {}
    }
    if (savedByLegacyForm && hex.toLowerCase() === LEGACY_STATUS_COLORS[scale]) {
        return {}
    }
    return { [scale]: hex }
}

export const defaultTheme = generateTheme({
    primaryColor: '#6e41e2',
    websiteName: 'Activepieces',
    fullLogoUrl: 'https://cdn.activepieces.com/brand/full-logo.png',
    favIconUrl: 'https://cdn.activepieces.com/brand/logo.svg',
    logoIconUrl: 'https://cdn.activepieces.com/brand/logo.svg',
})
