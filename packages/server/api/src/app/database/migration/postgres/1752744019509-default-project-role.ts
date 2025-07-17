import { apId, ProjectRole, RoleType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class DefaultProjectRole1752744019509 implements MigrationInterface {
    name = 'DefaultProjectRole1752744019509'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const ts = dayjs().toISOString()
        const defaultProjectMemberRole: ProjectRole = {
            id: apId(),
            name: 'Member',
            permissions: [],
            platformId: undefined,
            type: RoleType.DEFAULT,
            created: ts,
            updated: ts,
        }

        await queryRunner.query(
            `INSERT INTO "project_role" (id, name, permissions, type, "platformId", created, updated)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                defaultProjectMemberRole.id,
                defaultProjectMemberRole.name,
                defaultProjectMemberRole.permissions,
                defaultProjectMemberRole.type,
                defaultProjectMemberRole.platformId,
                defaultProjectMemberRole.created,
                defaultProjectMemberRole.updated,
            ],
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DELETE FROM "project_role" WHERE type = $1 AND name = $2',
            [RoleType.DEFAULT, 'Member']
        )
    }
}
