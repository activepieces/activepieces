import { flowVersionMigrationService } from './flow-version-migration.service'

export const onstartService = {
    async onstart() {
        await flowVersionMigrationService.migrate()
    },
}