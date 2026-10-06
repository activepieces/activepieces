import { createAction, Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudAssociations } from '../common/associations';
import { jumpcloudProps } from '../common/props';
import { userOnSystemOutputSchema } from '../output-schemas';

export const updateUserOnSystemAction = createAction({
    auth: jumpcloudAuth,
    name: 'update_user_on_system',
    classification: 'WRITE',
    displayName: 'Update User on System',
    description: "Set a user's administrator (sudo) rights on a device, binding the user to the device first if you choose.",
    audience: 'both',
    aiMetadata: {
        description:
            "Sets the binding between a JumpCloud user and a system (device): whether the user has administrator/sudo rights and whether sudo asks for a password. With Bind If Needed it also creates the binding; otherwise the user must already be bound. Use Create Association for a plain binding. Safe to retry with the same values.",
        idempotent: true,
    },
    props: {
        userId: jumpcloudProps.objectId({ displayName: 'User', fixedType: 'user' }),
        systemId: jumpcloudProps.objectId({ displayName: 'System (device)', fixedType: 'system' }),
        sudoEnabled: Property.Checkbox({
            displayName: 'Administrator (sudo) Rights',
            description: 'Gives the user administrator rights on this device.',
            required: false,
            defaultValue: false,
        }),
        sudoWithoutPassword: Property.Checkbox({
            displayName: 'Sudo Without Password',
            description: 'Lets the user run administrator commands without typing their password. Only applies with administrator rights.',
            required: false,
            defaultValue: false,
        }),
        bindIfNeeded: Property.Checkbox({
            displayName: 'Bind If Needed',
            description: 'Binds the user to the device when they are not bound yet. Leave off to only change an existing binding.',
            required: false,
            defaultValue: false,
        }),
    },
    outputSchema: userOnSystemOutputSchema,
    async run(context) {
        const { sudoEnabled, sudoWithoutPassword, bindIfNeeded } = context.propsValue;
        const enabled = sudoEnabled === true;
        const withoutPassword = enabled && sudoWithoutPassword === true;
        const ends = jumpcloudAssociations.parseEnds({
            objectType: 'user',
            objectId: context.propsValue.userId,
            targetType: 'system',
            targetId: context.propsValue.systemId,
        });
        await jumpcloudAssociations.change({
            auth: context.auth.props,
            op: bindIfNeeded === true ? 'add' : 'update',
            ends,
            attributes: { sudo: { enabled, withoutPassword } },
        });
        return {
            user_id: ends.sourceId,
            system_id: ends.targetId,
            sudo_enabled: enabled,
            sudo_without_password: withoutPassword,
        };
    },
});
