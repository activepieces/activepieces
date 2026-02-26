import { CustomAuthProperty } from '@activepieces/pieces-framework';
import React from 'react';

import { GenericPropertiesForm } from '@/app/builder/piece-properties/generic-properties-form';

type CustomAuthConnectionSettingsProps = {
  authProperty: CustomAuthProperty<any>;
  isGlobalConnection: boolean;
};

const CustomAuthConnectionSettings = React.memo(
  ({ authProperty, isGlobalConnection }: CustomAuthConnectionSettingsProps) => {
    return (
      <GenericPropertiesForm
        prefixValue="request.value.props"
        props={authProperty.props}
        useMentionTextInput={false}
        propertySettings={null}
        dynamicPropsInfo={null}
        showSecretInput={isGlobalConnection}
      />
    );
  },
);

CustomAuthConnectionSettings.displayName = 'CustomAuthConnectionSettings';
export { CustomAuthConnectionSettings };
