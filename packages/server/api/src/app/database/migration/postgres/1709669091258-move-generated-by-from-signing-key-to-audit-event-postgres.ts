import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'
import { apId } from '@activepieces/shared'

export class MoveGeneratedByFromSigningKeyToAuditEventPostgres1709669091258 implements MigrationInterface {
    name = 'MoveGeneratedByFromSigningKeyToAuditEventPostgres1709669091258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const ids = await getAllSigningKeyIds(queryRunner)

        for (const id of ids) {
            const signingKey = await getSigningKeyById(id, queryRunner)
            await generateAuditEventForSigningKey(signingKey, queryRunner)
        }

        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP CONSTRAINT "fk_signing_key_generated_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP COLUMN "generatedBy"
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD "generatedBy" character varying(21)
        `)

        const ids = await getAllCreatedSigningKeyAuditEventIds(queryRunner)

        for (const id of ids) {
            const auditEvent = await getCreatedSigningKeyAuditEventById(id, queryRunner)
            await populateSigningKeyGeneratedBy(auditEvent, queryRunner)
        }

        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ALTER COLUMN "generatedBy" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD CONSTRAINT "fk_signing_key_generated_by" FOREIGN KEY ("generatedBy") REFERENCES "user"("id")
            ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        logger.info({ name: this.name }, 'down')
    }

}

const getAllSigningKeyIds = async (queryRunner: QueryRunner): Promise<string[]> => {
    const queryResult: { id: string }[] = await queryRunner.query(
        'SELECT id FROM "signing_key"',
    )

    return queryResult.map(({ id }) => id)
}

const getSigningKeyById = async (id: string, queryRunner: QueryRunner): Promise<SigningKey> => {
    const queryResult = await queryRunner.query(
        'SELECT "id", "created", "generatedBy", "platformId", "displayName" FROM "signing_key" WHERE "id" = $1',
        [id],
    )

    return queryResult[0]
}

const generateAuditEventForSigningKey = async (signingKey: SigningKey, queryRunner: QueryRunner): Promise<void> => {
    const userEmail = await getUserEmail(signingKey.generatedBy, queryRunner)

    await queryRunner.query(
        `INSERT INTO "audit_event"
            (
                "id",
                "created",
                "updated",
                "platformId",
                "action",
                "userId",
                "userEmail",
                "data"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            apId(),
            signingKey.created,
            signingKey.created,
            signingKey.platformId,
            'CREATED_SIGNING_KEY',
            signingKey.generatedBy,
            userEmail,
            JSON.stringify({ signingKeyId: signingKey.id, signingKeyName: signingKey.displayName }),
        ],
    )
}

const getUserEmail = async (userId: string, queryRunner: QueryRunner): Promise<string> => {
    const queryResult = await queryRunner.query('SELECT "email" FROM "user" WHERE "id" = $1', [userId])
    return queryResult[0].email
}

const getAllCreatedSigningKeyAuditEventIds = async (queryRunner: QueryRunner): Promise<string[]> => {
    const queryResult: { id: string }[] = await queryRunner.query(
        'SELECT "id" FROM "audit_event" where "action" = $1',
        ['CREATED_SIGNING_KEY'],
    )

    return queryResult.map(({ id }) => id)
}

const getCreatedSigningKeyAuditEventById = async (id: string, queryRunner: QueryRunner): Promise<CreatedSigningKeyAuditEvent> => {
    const queryResult = await queryRunner.query(
        'SELECT "userId", "data" FROM "audit_event" WHERE "id" = $1',
        [id],
    )

    return queryResult[0]
}

const populateSigningKeyGeneratedBy = async (auditEvent: CreatedSigningKeyAuditEvent, queryRunner: QueryRunner): Promise<void> => {
    await queryRunner.query(
        'UPDATE "signing_key" SET "generatedBy" = $1 WHERE "id" = $2',
        [auditEvent.userId, auditEvent.data.signingKeyId],
    )
}

type SigningKey = {
    id: string
    created: string
    displayName: string
    platformId: string
    generatedBy: string
}

type CreatedSigningKeyAuditEvent = {
    userId: string
    data: {
        signingKeyId: string
    }
}
