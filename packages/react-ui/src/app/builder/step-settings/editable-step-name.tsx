import { t } from 'i18next'; // Import t directly from i18next
import { Pencil } from 'lucide-react';
import React from 'react';

import EditableText from '@/components/ui/editable-text';
import { isNil } from '@activepieces/shared';

interface EditableStepNameProps {
  selectedBranchIndex: number | null;
  displayName: string;
  branchName: string | undefined;
  setDisplayName: (value: string) => void;
  setBranchName: (value: string) => void;
  readonly: boolean;
  isEditingStepOrBranchName: boolean;
  setIsEditingStepOrBranchName: (isEditing: boolean) => void;
  setSelectedBranchIndex: (index: number | null) => void;
}

const EditableStepName: React.FC<EditableStepNameProps> = ({
  selectedBranchIndex,
  displayName,
  branchName,
  setDisplayName,
  setBranchName,
  readonly,
  isEditingStepOrBranchName,
  setIsEditingStepOrBranchName,
  setSelectedBranchIndex,
}) => {
  return (
    <>
      {isNil(selectedBranchIndex) ? (
        <EditableText
          onValueChange={(value) => {
            if (value) {
              setDisplayName(value);
            }
          }}
          readonly={readonly}
          value={displayName}
          tooltipContent={readonly ? '' : t('Edit Step Name')}
          isEditing={isEditingStepOrBranchName}
          setIsEditing={setIsEditingStepOrBranchName}
        />
      ) : (
        <>
          <div
            className="truncate cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBranchIndex(null);
            }}
          >
            {displayName}
          </div>
          /
          <EditableText
            key={branchName}
            onValueChange={(value) => {
              if (value) {
                setBranchName(value);
              }
            }}
            readonly={readonly}
            value={branchName}
            tooltipContent={readonly ? '' : t('Edit Branch Name')}
            isEditing={isEditingStepOrBranchName}
            setIsEditing={setIsEditingStepOrBranchName}
          />
        </>
      )}
      {!isEditingStepOrBranchName && !readonly && (
        <Pencil
          className="h-4 w-4 shrink-0"
          onClick={() => {
            setIsEditingStepOrBranchName(true);
          }}
        />
      )}
    </>
  );
};

export default EditableStepName;
