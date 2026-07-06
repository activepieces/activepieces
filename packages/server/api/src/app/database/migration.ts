import { MigrationInterface } from 'typeorm'

export type Migration = {
    name?: string
    breaking?: boolean
    release?: string
} & MigrationInterface
