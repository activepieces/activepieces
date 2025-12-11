import React from 'react';

import { GenericPropertiesFormComponent } from '@/app/builder/piece-properties/generic-properties-form';
import { CustomAuthProperty } from '@activepieces/pieces-framework';

type CustomAuthConnectionSettingsProps = {
  authProperty: CustomAuthProperty<any>;
};

const CustomAuthConnectionSettings = React.memo(
  ({ authProperty }: CustomAuthConnectionSettingsProps) => {
    return (
      <GenericPropertiesFormComponent
        prefixValue="request.value.props"
        props={authProperty.props}
        useMentionTextInput={false}
        allowDynamicValues={false}
      />
    );
  },
);

CustomAuthConnectionSettings.displayName = 'CustomAuthConnectionSettings';
export { CustomAuthConnectionSettings };
