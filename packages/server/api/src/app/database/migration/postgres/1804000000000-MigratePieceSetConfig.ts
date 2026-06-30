import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class MigratePieceSetConfig1804000000000 implements Migration {
    name = 'MigratePieceSetConfig1804000000000'
    breaking = false
    release = '0.103.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Transform existing JSONB config from boolean-map format to disabled-only arrays.
        // Extracts only entries with value = false into the new disabled* arrays.
        await queryRunner.query(`
            UPDATE "piece_set"
            SET config = jsonb_build_object(
                'disabledPieces',
                COALESCE(
                    (
                        SELECT jsonb_agg(k)
                        FROM jsonb_each_text("piece_set".config->'pieceOverrides') AS t(k, v)
                        WHERE v = 'false'
                    ),
                    '[]'::jsonb
                ),
                'disabledActions',
                COALESCE(
                    (
                        SELECT jsonb_object_agg(piece_name, disabled_actions)
                        FROM (
                            SELECT
                                piece_name,
                                jsonb_agg(action_name) AS disabled_actions
                            FROM (
                                SELECT
                                    piece_entry.key AS piece_name,
                                    action_entry.key AS action_name
                                FROM
                                    jsonb_each("piece_set".config->'actionOverrides') AS piece_entry(key, value),
                                    jsonb_each_text(piece_entry.value) AS action_entry(key, v)
                                WHERE action_entry.v = 'false'
                            ) AS filtered_actions
                            GROUP BY piece_name
                        ) AS grouped_actions
                    ),
                    '{}'::jsonb
                ),
                'disabledTriggers',
                COALESCE(
                    (
                        SELECT jsonb_object_agg(piece_name, disabled_triggers)
                        FROM (
                            SELECT
                                piece_name,
                                jsonb_agg(trigger_name) AS disabled_triggers
                            FROM (
                                SELECT
                                    piece_entry.key AS piece_name,
                                    trigger_entry.key AS trigger_name
                                FROM
                                    jsonb_each("piece_set".config->'triggerOverrides') AS piece_entry(key, value),
                                    jsonb_each_text(piece_entry.value) AS trigger_entry(key, v)
                                WHERE trigger_entry.v = 'false'
                            ) AS filtered_triggers
                            GROUP BY piece_name
                        ) AS grouped_triggers
                    ),
                    '{}'::jsonb
                )
            )
            WHERE config ? 'pieceOverrides'
        `)

        await queryRunner.query(`
            ALTER TABLE "piece_set"
            ALTER COLUMN config SET DEFAULT '{"disabledPieces":[],"disabledActions":{},"disabledTriggers":{}}'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_set"
            ALTER COLUMN config SET DEFAULT '{"pieceOverrides":{},"actionOverrides":{},"triggerOverrides":{}}'
        `)

        await queryRunner.query(`
            UPDATE "piece_set"
            SET config = jsonb_build_object(
                'pieceOverrides',
                COALESCE(
                    (
                        SELECT jsonb_object_agg(piece_name, false)
                        FROM jsonb_array_elements_text("piece_set".config->'disabledPieces') AS piece_name
                    ),
                    '{}'::jsonb
                ),
                'actionOverrides',
                COALESCE(
                    (
                        SELECT jsonb_object_agg(piece_name, action_map)
                        FROM (
                            SELECT
                                piece_entry.key AS piece_name,
                                (
                                    SELECT jsonb_object_agg(action_name, false)
                                    FROM jsonb_array_elements_text(piece_entry.value) AS action_name
                                ) AS action_map
                            FROM jsonb_each("piece_set".config->'disabledActions') AS piece_entry(key, value)
                        ) AS piece_maps
                    ),
                    '{}'::jsonb
                ),
                'triggerOverrides',
                COALESCE(
                    (
                        SELECT jsonb_object_agg(piece_name, trigger_map)
                        FROM (
                            SELECT
                                piece_entry.key AS piece_name,
                                (
                                    SELECT jsonb_object_agg(trigger_name, false)
                                    FROM jsonb_array_elements_text(piece_entry.value) AS trigger_name
                                ) AS trigger_map
                            FROM jsonb_each("piece_set".config->'disabledTriggers') AS piece_entry(key, value)
                        ) AS piece_maps
                    ),
                    '{}'::jsonb
                )
            )
            WHERE config ? 'disabledPieces'
        `)
    }
}
