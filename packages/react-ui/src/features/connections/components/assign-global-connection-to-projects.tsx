import { t } from 'i18next';
import { Control } from 'react-hook-form';

import { projectCollectionUtils } from '@/hooks/project-collection';
import { isNil } from '@activepieces/shared';

import { MultiSelectPieceProperty } from '../../../components/custom/multi-select-piece-property';
import { FormField, FormItem, FormMessage } from '../../../components/ui/form';
import { Label } from '../../../components/ui/label';

export const AssignConnectionToProjectsControl = ({
  control,
  name,
}: {
  control: Control<any>;
  name: string;
}) => {
  const { data: projects } = projectCollectionUtils.useAll();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <Label>{t('Available for Projects')}</Label>
          <MultiSelectPieceProperty
            placeholder={t('Select projects')}
            options={
              projects?.map((project) => ({
                value: project.id,
                label: project.displayName,
              })) ?? []
            }
            loading={!projects}
            onChange={(value) => {
              field.onChange(isNil(value) ? [] : value);
            }}
            initialValues={field.value}
            showDeselect={field.value.length > 0}
          />

          <FormMessage className="mt-4!" />
        </FormItem>
      )}
    />
  );
};
