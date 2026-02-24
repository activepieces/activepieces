import React from 'react';

import { GenericPropertiesForm } from '@/app/builder/piece-properties/generic-properties-form';
import { CustomAuthProperty } from '@activepieces/pieces-framework';

type CustomAuthConnectionSettingsProps = {
  authProperty: CustomAuthProperty<any>;
};

const CustomAuthConnectionSettings = React.memo(
  ({ authProperty }: CustomAuthConnectionSettingsProps) => {
    return (
      <GenericPropertiesForm
        prefixValue="request.value.props"
        props={authProperty.props}
        useMentionTextInput={false}
        propertySettings={null}
        dynamicPropsInfo={null}
      />
    );
  },
);

CustomAuthConnectionSettings.displayName = 'CustomAuthConnectionSettings';
export { CustomAuthConnectionSettings };
