import {EntitySchema} from "typeorm"
import {User} from "shared/dist";
import {BaseColumnSchemaPart} from "./base-entity";

export const UserEntity = new EntitySchema<User>({
    name: "user",
    columns: {
        ...BaseColumnSchemaPart,
        email: {
            type: String,
            unique: true
        },
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        password: {
            type: String
        },
        status: {
            type: String
        }
    },
})
