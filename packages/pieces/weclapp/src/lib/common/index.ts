import { PieceAuth, PiecePropValueSchema, Property, StaticPropsValue } from "@activepieces/pieces-framework";
import { WeClappClient } from "./client";
import { isNil } from "@activepieces/shared";

const ENTITY_TYPES: { [k: string]: string } = {
    customer: 'Customer',
    contact: 'Contacts'
}

const ENTITY_LABELS: { [k: string]: (o: any) => any } = {
    customer: e => e.company || (e.firstName + ' ' + e.lastName),
    contact: e => e.company || (e.firstName + ' ' + e.lastName)
}

type AuthValue = PiecePropValueSchema<typeof weclappCommon.auth>

export function makeClient(auth: AuthValue): WeClappClient {
    return new WeClappClient(auth.tenant, auth.token)
}

export const weclappCommon = {
    auth: PieceAuth.CustomAuth({
        displayName: 'Authentication',
        required: true,
        props: {
            tenant: Property.ShortText({
                displayName: 'Tenant',
                required: true,
                description: "This is your tenant prefix (e.g. https://<tenant>.weclapp.com)"
            }),
            token: PieceAuth.SecretText({
                displayName: 'API-Token',
                description: "Your api token (can be found in profile settings)",
                required: true,
            })
        }
    }),
    entityType: (required = true) => Property.StaticDropdown({
        displayName: 'Entity Type',
        required,
        options: {
            options: Object.keys(ENTITY_TYPES).map(t => ({
                label: ENTITY_TYPES[t],
                value: t
            }))
        }
    }),
    entityId: (required = true) => Property.Dropdown({
        displayName: 'Entity',
        required,
        refreshers: ['entity_type'],
        options: async ({ auth, entity_type }) => {
            if (isNil(auth)) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                };
            }
            if (isNil(entity_type)) {
                return {
                    disabled: true,
                    placeholder: 'select an entity',
                    options: []
                };
            }
            const client = makeClient(auth as AuthValue)
            const entities = await client.list(entity_type as string)
            return {
                disabled: false,
                options: entities.map((entity) => {
                    return {
                        label: ENTITY_LABELS[entity_type as string](entity),
                        value: entity.id
                    }
                })
            }
        }
    })
}