import { MigrationInterface, QueryRunner } from 'typeorm'
import { encryptUtils } from '../../../helper/encryption'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

type OldAiProviderConfig = {
    defaultHeaders: Record<string, string>
}

type NewAiProviderConfig = {
    apiKey: string
}

export class AIProviderRedactorPostgres1748871900624 implements MigrationInterface {
    name = 'AIProviderRedactorPostgres1748871900624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('AIProviderRedactorPostgres1748871900624 up: started')


        const aiProviders = await queryRunner.query(`
            SELECT id, config, provider FROM "ai_provider"
        `)

        for (const provider of aiProviders) {
            try {
                const decryptedConfig: OldAiProviderConfig = await encryptUtils.decryptObject(provider.config)

                let apiKey = ''
                const providerType = provider.provider.toLowerCase()
                
                if (providerType === 'anthropic') {
                    apiKey = decryptedConfig.defaultHeaders['x-api-key'] || ''
                }
                else if (providerType === 'openai' || providerType === 'replicate') {
                    const authHeader = decryptedConfig.defaultHeaders['Authorization'] || ''
                    apiKey = authHeader.replace(/^Bearer\s+/i, '')
                }

                if (apiKey === '') {
                    log.error(`No API key found for AI provider ${provider.id}`)
                    continue
                }

                const newConfig: NewAiProviderConfig = {
                    apiKey,
                }

                const encryptedNewConfig = encryptUtils.encryptObject(newConfig)
                
                await queryRunner.query(`
                    UPDATE "ai_provider" SET config = $1 WHERE id = $2
                `, [encryptedNewConfig, provider.id])
            }
            catch (error) {
                log.error(`Failed to transform config for provider ${provider.id}:`, error)
                throw error
            }
        }

        await queryRunner.query(`
            ALTER TABLE "ai_provider" DROP COLUMN "baseUrl"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider" DROP CONSTRAINT "fk_ai_provider_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider" ALTER COLUMN "platformId" TYPE character varying(21)
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        log.info('AIProviderRedactorPostgres1748871900624 up: finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('AIProviderRedactorPostgres1748871900624 down: started')


        const aiProviders = await queryRunner.query(`
            SELECT id, config, provider FROM "ai_provider"
        `)

        for (const provider of aiProviders) {
            try {
                const decryptedConfig: NewAiProviderConfig = await encryptUtils.decryptObject(provider.config)
                
                const defaultHeaders: Record<string, string> = {}
                const providerType = provider.provider.toLowerCase()
                
                if (providerType === 'anthropic') {
                    defaultHeaders['x-api-key'] = decryptedConfig.apiKey
                }
                else if (providerType === 'openai' || providerType === 'replicate') {
                    defaultHeaders['Authorization'] = `Bearer ${decryptedConfig.apiKey}`
                }
                else {
                    defaultHeaders['Authorization'] = decryptedConfig.apiKey
                }

                const oldConfig: OldAiProviderConfig = {
                    defaultHeaders,
                }

                const encryptedOldConfig = encryptUtils.encryptObject(oldConfig)
                
                await queryRunner.query(`
                    UPDATE "ai_provider" SET config = $1 WHERE id = $2
                `, [encryptedOldConfig, provider.id])
            }
            catch (error) {
                log.error(`Failed to reverse transform config for provider ${provider.id}:`, error)
                const fallbackConfig = encryptUtils.encryptObject({ defaultHeaders: {} })
                await queryRunner.query(`
                    UPDATE "ai_provider" SET config = $1 WHERE id = $2
                `, [fallbackConfig, provider.id])
            }
        }

        await queryRunner.query(`
            ALTER TABLE "ai_provider" DROP CONSTRAINT "fk_ai_provider_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider" ALTER COLUMN "platformId" TYPE character varying
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD "baseUrl" character varying NOT NULL
        `)

        log.info('AIProviderRedactorPostgres1748871900624 down: finished')
    }
}
