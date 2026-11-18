import { MigrationInterface } from 'typeorm'

export type BackgroundMigration = MigrationInterface & {
    name: string
    release: string
    transaction: false
}
