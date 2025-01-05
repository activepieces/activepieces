import { isNil } from "@activepieces/shared";
import { t } from "i18next";
import { Control } from "react-hook-form";
import { FormField, FormItem } from "./form";
import { projectHooks } from "@/hooks/project-hooks";
import { Label } from "./label";
import { MultiSelectPieceProperty } from "../custom/multi-select-piece-property";

export const AssignConnectionToProjectsControl = (
    {
        control,
        name,
    }: {
        control: Control<any>,
        name: string,
    }
) => {
    const { data: projects } = projectHooks.useProjects();
    return <>
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
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
                  </FormItem>
                )}
              />
    </>

}