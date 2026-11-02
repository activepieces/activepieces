import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropRetiredPlatformPlanColumns1880000000000 implements Migration {
    name = 'DropRetiredPlatformPlanColumns1880000000000'
    breaking = true
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ${RETIRED_COLUMNS.map(({ name }) => `DROP COLUMN IF EXISTS "${name}"`).join(',\n            ')}
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ${RETIRED_COLUMNS.map(({ name, definition }) => `ADD COLUMN IF NOT EXISTS "${name}" ${definition}`).join(',\n            ')}
        `)
    }
}

const RETIRED_COLUMNS = [
    { name: 'projectsLimit', definition: 'integer' },
    { name: 'dedicatedWorkers', definition: 'jsonb' },
    { name: 'canary', definition: 'boolean NOT NULL DEFAULT false' },
    { name: 'customDomainsEnabled', definition: 'boolean NOT NULL DEFAULT false' },
    { name: 'stripeCustomerId', definition: 'character varying' },
    { name: 'stripeSubscriptionId', definition: 'character varying' },
    { name: 'stripeSubscriptionStatus', definition: 'character varying' },
    { name: 'stripeSubscriptionStartDate', definition: 'integer' },
    { name: 'stripeSubscriptionEndDate', definition: 'integer' },
    { name: 'stripeSubscriptionCancelDate', definition: 'integer' },
    { name: 'aiCreditsAutoTopUpState', definition: 'character varying NOT NULL DEFAULT \'disabled\'' },
    { name: 'aiCreditsAutoTopUpThreshold', definition: 'integer' },
    { name: 'aiCreditsAutoTopUpCreditsToAdd', definition: 'integer' },
    { name: 'maxAutoTopUpCreditsMonthly', definition: 'integer' },
    { name: 'lastFreeAiCreditsRenewalDate', definition: 'timestamp with time zone' },
    { name: 'includedAiCredits', definition: 'integer NOT NULL DEFAULT 0' },
    { name: 'teamProjectsLimit', definition: 'character varying NOT NULL DEFAULT \'NONE\'' },
]
