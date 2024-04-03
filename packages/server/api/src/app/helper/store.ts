import fs from 'fs'
import path from 'path'
import { system, SystemProp } from '@activepieces/server-shared'

export const localFileStore = {
    async save(key: string, value: string): Promise<void> {
        const settingsFilePath = path.join(
            system.getOrThrow(SystemProp.CONFIG_PATH),
            'settings.json',
        )
        const settings = getSettingsFilePath()
        settings[key] = value
        const parentDir = path.dirname(settingsFilePath)
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true })
        }
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings))
    },

    async load(key: string): Promise<string | null> {
        const settings = getSettingsFilePath()
        return settings[key] || null
    },
}

const getSettingsFilePath = () => {
    const settingsFilePath = path.join(
        system.getOrThrow(SystemProp.CONFIG_PATH),
        'settings.json',
    )
    try {
        return JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'))
    }
    catch (error) {
        return {}
    }
}
