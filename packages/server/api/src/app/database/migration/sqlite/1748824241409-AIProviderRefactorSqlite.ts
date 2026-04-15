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

export class AIProviderRefactorSqlite1748824241409 implements MigrationInterface {
    name = 'AIProviderRefactorSqlite1748824241409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AIProviderRefactorSqlite1748824241409#up] started')

    
        // Create backup table first
        await queryRunner.query(`
            CREATE TABLE "ai_provider_backup" AS 
            SELECT * FROM "ai_provider"
        `)
        log.info('[AIProviderRefactorSqlite1748824241409#up] Created backup table ai_provider_backup')

        try {
            const aiProviders = await queryRunner.query(`
                SELECT id, config, provider FROM "ai_provider"
            `)

            let successCount = 0
            let errorCount = 0

            for (const provider of aiProviders) {
                try {
                    const decryptedConfig: OldAiProviderConfig = await encryptUtils.decryptObject(JSON.parse(provider.config))
                    
                    // Validate that we have the expected structure
                    if (!decryptedConfig.defaultHeaders || typeof decryptedConfig.defaultHeaders !== 'object') {
                        throw new Error(`Invalid config structure for provider ${provider.id}: missing or invalid defaultHeaders`)
                    }
                    
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
                        throw new Error(`No API key found for AI provider ${provider.id} of type ${providerType}`)
                    }

                    const newConfig: NewAiProviderConfig = {
                        apiKey,
                    }

                    const encryptedNewConfig = encryptUtils.encryptObject(newConfig)
                    
                    await queryRunner.query(`
                        UPDATE "ai_provider" SET config = ? WHERE id = ?
                    `, [JSON.stringify(encryptedNewConfig), provider.id])
                    
                    successCount++
                    log.info({ providerId: provider.id, providerType }, '[AIProviderRefactorSqlite1748824241409#up] Successfully migrated provider')
                }
                catch (error) {
                    errorCount++
                    log.error({
                        err: error,
                        providerId: provider.id,
                    }, '[AIProviderRefactorSqlite1748824241409#up] Failed to transform config for provider')
                    throw new Error(`Migration failed for provider ${provider.id}: ${error instanceof Error ? error.message : String(error)}`)
                }
            }

            log.info({ successCount, errorCount }, '[AIProviderRefactorSqlite1748824241409#up] Migration completed successfully')

            // Only proceed with schema changes if all data migrations succeeded
            await queryRunner.query('DROP INDEX IF EXISTS "idx_ai_provider_platform_id_provider"')
            await queryRunner.query('ALTER TABLE "ai_provider" DROP COLUMN "baseUrl"')
            
            await queryRunner.query(`
                CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
            `)

            await queryRunner.query('DROP TABLE "ai_provider_backup"')
            log.info('[AIProviderRefactorSqlite1748824241409#up] Dropped backup table after successful migration')

        }
        catch (error) {
            log.error({
                err: error,
            }, '[AIProviderRefactorSqlite1748824241409#up] Migration failed, restoring from backup')
                
            // Restore from backup
            await queryRunner.query('DROP TABLE "ai_provider"')
            await queryRunner.query('ALTER TABLE "ai_provider_backup" RENAME TO "ai_provider"')
            
            throw error instanceof Error ? error : new Error(String(error))
        }

        log.info('[AIProviderRefactorSqlite1748824241409#up] finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('[AIProviderRefactorSqlite1748824241409#down] started')

        // Create backup table first
        await queryRunner.query(`
            CREATE TABLE "ai_provider_backup" AS 
            SELECT * FROM "ai_provider"
        `)
        log.info('[AIProviderRefactorSqlite1748824241409#down] Created backup table ai_provider_backup')

        try {
            const aiProviders = await queryRunner.query(`
                SELECT id, config, provider FROM "ai_provider"
            `)

            let successCount = 0
            let errorCount = 0

            for (const provider of aiProviders) {
                try {
                    const decryptedConfig: NewAiProviderConfig = await encryptUtils.decryptObject(JSON.parse(provider.config))
                    
                    if (!decryptedConfig.apiKey || typeof decryptedConfig.apiKey !== 'string') {
                        throw new Error(`Invalid config structure for provider ${provider.id}: missing or invalid apiKey`)
                    }
                    
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
                        UPDATE "ai_provider" SET config = ? WHERE id = ?
                    `, [JSON.stringify(encryptedOldConfig), provider.id])
                    
                    successCount++
                    log.info({ providerId: provider.id, providerType }, '[AIProviderRefactorSqlite1748824241409#down] Successfully rolled back provider')
                }
                catch (error) {
                    errorCount++
                    log.error({
                        err: error,
                        providerId: provider.id,
                    }, '[AIProviderRefactorSqlite1748824241409#down] Failed to reverse transform config for provider')
                    
                    // Don't use a fallback - keep original data and fail the migration
                    throw new Error(`Rollback failed for provider ${provider.id}: ${error instanceof Error ? error.message : String(error)}`)
                }
            }

            log.info({ successCount, errorCount }, '[AIProviderRefactorSqlite1748824241409#down] Rollback completed successfully')

            await queryRunner.query('DROP INDEX IF EXISTS "idx_ai_provider_platform_id_provider"')
            await queryRunner.query('ALTER TABLE "ai_provider" ADD COLUMN "baseUrl" varchar NOT NULL DEFAULT ""')
            
            await queryRunner.query(`
                CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
            `)

            await queryRunner.query('DROP TABLE "ai_provider_backup"')
            log.info('[AIProviderRefactorSqlite1748824241409#down] Dropped backup table after successful rollback')

        }
        catch (error) {
            log.error({
                err: error,
            }, '[AIProviderRefactorSqlite1748824241409#down] Rollback failed, restoring from backup')
            
            await queryRunner.query('DROP TABLE "ai_provider"')
            await queryRunner.query('ALTER TABLE "ai_provider_backup" RENAME TO "ai_provider"')
            
            throw error instanceof Error ? error : new Error(String(error))
        }

        log.info('[AIProviderRefactorSqlite1748824241409#down] finished')
    }
}
