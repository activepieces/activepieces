import React from 'react';

import { ArrayProperty } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { AutoPropertiesFormComponent } from './auto-properties-form';

type ArrayPiecePropertyInListMapperModeProps = {
  inputName: string;
  arrayProperty: ArrayProperty<boolean>;
  disabled: boolean;
};

const ArrayPiecePropertyInListMapperMode = React.memo(
  ({
    inputName,
    disabled,
    arrayProperty,
  }: ArrayPiecePropertyInListMapperModeProps) => {
    if (isNil(arrayProperty.properties)) return <></>;
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="p-4 border rounded-md flex flex-col gap-4">
          <AutoPropertiesFormComponent
            prefixValue={inputName}
            props={arrayProperty.properties}
            useMentionTextInput={true}
            allowDynamicValues={false}
            disabled={disabled}
          />
        </div>
      </div>
    );
  },
);

ArrayPiecePropertyInListMapperMode.displayName =
  'ArrayPiecePropertyInListMapperMode';
export { ArrayPiecePropertyInListMapperMode };
