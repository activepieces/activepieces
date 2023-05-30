import executeQuery from "./execute-query";
import getTables from "./get-tables";
import insertRow from "./insert-row";
import updateRows from "./update-rows";
import deleteRows from "./delete-rows";
import selectRows from "./select-rows";

export default [
    selectRows,
    insertRow,
    updateRows,
    deleteRows,
    getTables,
    executeQuery
]