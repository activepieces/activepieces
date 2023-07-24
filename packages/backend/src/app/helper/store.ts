import fs from 'fs'
import path from 'path'
import os from 'os'

export const localStore = {
    async save(key: string, value: string): Promise<void> {
        const settingsFilePath = path.join(localStore.getStorePath(), 'settings.json')
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'))
        settings[key] = value
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings))
    },

    async load(key: string): Promise<string | null> {
        const settingsFilePath = path.join(localStore.getStorePath(), 'settings.json')
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'))
        return settings[key] || null
    },
    getStorePath(): string {
        return path.join(os.homedir(), '.activepieces')
    },
}
