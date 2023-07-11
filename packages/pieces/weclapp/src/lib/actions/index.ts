import createEntity from "./entity/create-entity";
import deleteEntity from "./entity/delete-entity";
import getEntity from "./entity/get-entity";
import listEntities from "./entity/list-entities";
import updateEntity from "./entity/update-entity";

export default [
    listEntities,
    createEntity,
    getEntity,
    updateEntity,
    deleteEntity
]