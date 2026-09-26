import { DEFAULT_BRAND_LOGOS } from '@activepieces/shared'
import tinycolor from 'tinycolor2'

export function generateTheme({
    primaryColor,
    fullLogoUrl,
    favIconUrl,
    logoIconUrl,
    websiteName,
}: {
    primaryColor: string
    fullLogoUrl: string
    favIconUrl: string
    logoIconUrl: string
    websiteName: string
}) {
    return {
        websiteName,
        colors: {
            primary: {
                default: tinycolor(primaryColor).toHexString(),
            },
        },
        logos: {
            fullLogoUrl,
            favIconUrl,
            logoIconUrl,
        },
    }
}

export const defaultTheme = generateTheme({
    primaryColor: '#6e41e2',
    websiteName: 'Activepieces',
    ...DEFAULT_BRAND_LOGOS,
})
