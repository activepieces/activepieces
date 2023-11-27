import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import i18next from 'i18next'
import { logger } from '../helper/logger'
const LanguageBodySchema = Type.Object({
    language: Type.String(),
})
type LanguageBody = Static<typeof LanguageBodySchema>
export const i18nController: FastifyPluginAsyncTypebox = async (app) => {
    app.post<{
        Body: LanguageBody
    }>(
        '/language',
        {
            schema: {
                body: LanguageBodySchema,
            },
        },
        async (request) => {
            const { language } = request.body
            try {
                i18next.changeLanguage(language)
                return { success: true, message: `${language}` }
            }
            catch (err) {
                logger.error('Erreur while changing language:', err)
                return { success: false, message: 'error while changing language' }
            }
        },
    )
}