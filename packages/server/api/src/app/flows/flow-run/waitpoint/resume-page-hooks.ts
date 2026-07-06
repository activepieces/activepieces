import { defaultTheme, generateTheme } from '../../../flags/theme'
import { hooksFactory } from '../../../helper/hooks-factory'

export const resumePageHooks = hooksFactory.create<ResumePageHooks>(() => ({
    async getTheme(): Promise<ResumePageTheme> {
        return defaultTheme
    },
}))

export type ResumePageTheme = ReturnType<typeof generateTheme>

export type ResumePageHooks = {
    getTheme(params: { platformId: string | null }): Promise<ResumePageTheme>
}
