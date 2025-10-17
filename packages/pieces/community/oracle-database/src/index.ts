    import { createPiece } from "@activepieces/pieces-framework";
    import { oracleDbAuth } from "./lib/common/auth"
    import { insertRowAction } from "./lib/actions/insert-row"
    import { insertRowsAction } from './lib/actions/insert-rows';
    import { runCustomSqlAction } from './lib/actions/run-custom-sql';
    import { updateRowAction } from './lib/actions/update-row';
    import { deleteRowAction } from './lib/actions/delete-row';
    import { findRowAction } from './lib/actions/find-row';
    import { newRowTrigger } from './lib/triggers/new-row';

    export const oracleDatabase = createPiece({
      displayName: 'Oracle-database',
      auth: oracleDbAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/oracle-database.png',
      authors: ['Prabhukiran161'],
      actions: [
        insertRowAction,
        insertRowsAction,
        runCustomSqlAction,
        updateRowAction,
        deleteRowAction,
        findRowAction
      ],
      triggers: [ newRowTrigger ]
    });
    