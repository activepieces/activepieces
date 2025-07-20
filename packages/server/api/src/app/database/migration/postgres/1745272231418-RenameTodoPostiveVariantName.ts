import { STATUS_VARIANT, StatusOption } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

const OLD_STATUS_VARIANT = 'Postive (Green)'
const NEW_STATUS_VARIANT = 'Positive (Green)'

export class RenameTodoPostiveVariantName1745272231418 implements MigrationInterface {
    name = 'RenameTodoPostiveVariantName1745272231418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const allTodos = await queryRunner.query('SELECT * FROM todo')

        for (const todo of allTodos) {
            const status = todo.status as StatusOption
            if ((status.variant as string) === OLD_STATUS_VARIANT) {
                status.variant = NEW_STATUS_VARIANT as STATUS_VARIANT
            }

            const statusOptions = todo.statusOptions as StatusOption[]
            for (const statusOption of statusOptions) {
                if ((statusOption.variant as string) === OLD_STATUS_VARIANT) {
                    statusOption.variant = NEW_STATUS_VARIANT as STATUS_VARIANT
                }
            }

            await queryRunner.query('UPDATE todo SET status = $1, "statusOptions" = $2 WHERE id = $3', [JSON.stringify(status), JSON.stringify(statusOptions), todo.id])
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No need to do anything, the data is already migrated
    }

}
