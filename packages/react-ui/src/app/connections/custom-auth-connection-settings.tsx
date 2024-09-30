import React from 'react';

import { AutoPropertiesFormComponent } from '@/app/builder/piece-properties/auto-properties-form';
import { CustomAuthProperty } from '@activepieces/pieces-framework';

type CustomAuthConnectionSettingsProps = {
  authProperty: CustomAuthProperty<any>;
};

const CustomAuthConnectionSettings = React.memo(
  ({ authProperty }: CustomAuthConnectionSettingsProps) => {
    return (
      <AutoPropertiesFormComponent
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
