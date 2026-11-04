import { defaultTheme, generateTheme } from '../flags/theme'
import { domainHelper } from '../helper/domain-helper'
import { hooksFactory } from '../helper/hooks-factory'

export const resumePageHooks = hooksFactory.create<ResumePageHooks>(() => ({
    async getTheme(): Promise<ResumePageTheme> {
        return defaultTheme
    },
    async getPublicApiBaseUrl(): Promise<string> {
        return domainHelper.getPublicApiUrl({ path: '' })
    },
}))

export type ResumePageTheme = ReturnType<typeof generateTheme>

export type ResumePageHooks = {
    getTheme(params: { platformId: string | null }): Promise<ResumePageTheme>
    getPublicApiBaseUrl(params: { platformId: string }): Promise<string>
}
