import React from 'react';
import { CustomAuthProperty } from '@activepieces/pieces-framework';
import { AutoPropertiesFormComponent } from '@/features/properties-form/components/auto-properties-form';

type CustomAuthConnectionSettingsProps = {
    authProperty: CustomAuthProperty<any>;
};


const CustomAuthConnectionSettings = React.memo(
    ({
        authProperty,
    }: CustomAuthConnectionSettingsProps) => {

        return (
            <>
                <AutoPropertiesFormComponent
                    prefixValue="request.value"
                    props={authProperty.props}
                    allowDynamicValues={false}
                    renderSecretTextDescription={true}
                    renderSecretText={true}
                />
            </>
        );
    },
);

CustomAuthConnectionSettings.displayName = 'CustomAuthConnectionSettings';
export { CustomAuthConnectionSettings };