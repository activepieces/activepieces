import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

const FLOW_VERSION_TABLE = 'flow_version'
const APP_CONNECTION_TABLE = 'app_connection'
const PIECE_TYPE = 'PIECE'
const PIECE_TRIGGER_TYPE = 'PIECE_TRIGGER'
const BRANCH_TYPE = 'BRANCH'

type Step = {
    type: string
    settings: {
        pieceName: string
        pieceVersion: string
    }
    onFailureAction?: Step
    onSuccessAction?: Step
    nextAction?: Step
}

export class bumpFixPieceVersions1678928503715 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('bumpFixPieceVersions1678928503715, started')

        let count = 0
        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')

        for (const flowVersion of flowVersions) {
            const step = flowVersion.trigger
            const update = updateStep(step)
            if (update) {
                count++
                await queryRunner.query(
                    `UPDATE ${FLOW_VERSION_TABLE} SET "trigger" = $1 WHERE id = $2`,
                    [flowVersion.trigger, flowVersion.id],
                )
            }
        }

        let connectionCount = 0
        const appConnections = await queryRunner.query(
            `SELECT * FROM ${APP_CONNECTION_TABLE}`,
        )
        for (const appConnection of appConnections) {
            let update = false
            if (appConnection.appName === 'google_sheets') {
                appConnection.appName = 'google-sheets'
                update = true
            }
            if (appConnection.appName === 'google_calendar') {
                appConnection.appName = 'google-calendar'
                update = true
            }
            if (appConnection.appName === 'google_contacts') {
                appConnection.appName = 'google-contacts'
                update = true
            }
            if (appConnection.appName === 'google_drive') {
                appConnection.appName = 'google-drive'
                update = true
            }
            if (appConnection.appName === 'google_tasks') {
                appConnection.appName = 'google-tasks'
                update = true
            }
            if (appConnection.appName === 'cal.com') {
                appConnection.appName = 'cal-com'
                update = true
            }
            if (appConnection.appName === 'storage') {
                appConnection.appName = 'store'
                update = true
            }
            if (appConnection.appName === 'telegram_bot') {
                appConnection.appName = 'telegram-bot'
                update = true
            }
            if (update) {
                connectionCount++
                await queryRunner.query(
                    `UPDATE ${APP_CONNECTION_TABLE} SET "appName" = $1 WHERE id = $2`,
                    [appConnection.appName, appConnection.id],
                )
            }
        }
        log.info(
            'bumpFixPieceVersions1678928503715, finished bumping ' +
        count +
        ' flows ' +
        ' and connections count ' +
        connectionCount,
        )
    }

    public async down(): Promise<void> {
    // Ignored
    }
}

function updateStep(step: Step | undefined): boolean {
    let update = false
    while (step) {
        if (step.type === PIECE_TYPE || step.type === PIECE_TRIGGER_TYPE) {
            if (step.settings.pieceName === 'google_sheets') {
                step.settings.pieceName = 'google-sheets'
            }
            if (step.settings.pieceName === 'google_calendar') {
                step.settings.pieceName = 'google-calendar'
            }
            if (step.settings.pieceName === 'google_contacts') {
                step.settings.pieceName = 'google-contacts'
            }
            if (step.settings.pieceName === 'google_drive') {
                step.settings.pieceName = 'google-drive'
            }
            if (step.settings.pieceName === 'google_tasks') {
                step.settings.pieceName = 'google-tasks'
            }
            if (step.settings.pieceName === 'cal.com') {
                step.settings.pieceName = 'cal-com'
            }
            if (step.settings.pieceName === 'storage') {
                step.settings.pieceName = 'store'
            }
            if (step.settings.pieceName === 'telegram_bot') {
                step.settings.pieceName = 'telegram-bot'
            }
            if (step.settings.pieceName === 'youtube') {
                // Youtube latest version is 0.1.4
                step.settings.pieceVersion = '0.1.4'
            }
            else {
                step.settings.pieceVersion = '0.1.3'
            }
            update = true
        }
        if (step.type === BRANCH_TYPE) {
            if (step.onSuccessAction) {
                update = update || updateStep(step.onSuccessAction)
            }
            if (step.onFailureAction) {
                update = update || updateStep(step.onFailureAction)
            }
        }

        step = step.nextAction
    }
    return update
}
