import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  CodeAction,
  FlowOperationType,
  isNil,
  MarkdownVariant
} from '@activepieces/shared';

import { AutoPropertiesFormComponent } from '../../piece-properties/auto-properties-form';
import { formUtils } from '../../piece-properties/form-utils';
import { useStepSettingsContext } from '../step-settings-context';


import { codePropsUtils } from '../../piece-properties/code-props-utils';
import { PieceAuthProperty, PieceProperty, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import { InputProperty } from '../../../../../../pieces/community/framework/src/lib/property/input';
import { ConnectionSelect } from '../piece-settings/connection-select';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { ApMarkdown } from '@/components/custom/markdown';
import { t } from 'i18next';
import { AskAiButton } from '../../pieces-selector/ask-ai';
import { DictionaryProperty } from '../../piece-properties/dictionary-property';
import { platformHooks } from '@/hooks/platform-hooks';

type CodePropsInputFormParams = {
  flowId: string;
  readonly: boolean;
};


const isAuthProperty = (prop: PieceProperty) => prop.type === PropertyType.BASIC_AUTH || prop.type === PropertyType.OAUTH2 || prop.type === PropertyType.CUSTOM_AUTH || prop.type === PropertyType.SECRET_TEXT;
const markdown = `
To use data from previous steps in your code, include them as pairs of keys and values below. 

You can access these inputs in your code using \`inputs.key\`, where \`key\` is the name you assigned below.  
`;

const splitCodeProps = (convertedCodeProps: PiecePropertyMap) => {
    const authProps = Object.entries(convertedCodeProps).reduce((acc, [key, prop]) => {
      if(isAuthProperty(prop)) {
        acc[key] = prop;
      }
      return acc;
    }, {} as Record<string, PieceAuthProperty>);
    const nonAuthProps = Object.entries(convertedCodeProps).reduce((acc, [key, prop]) => {
      if(!isAuthProperty(prop)) {
        acc[key] = prop;
      }
      return acc;
    }, {} as Record<string, InputProperty>);
    return { authProps, nonAuthProps };
 }

const CodePropsInputForm = React.memo((params: CodePropsInputFormParams) => {
  const { piecesModels,selectedStep } = useStepSettingsContext();
  const props = codePropsUtils.extractPropsFromCode(selectedStep.settings.sourceCode.code);
  const isCopilotEnabled = platformHooks.isCopilotEnabled();
  const form = useFormContext<CodeAction>();
  if (isNil(props))
  {
    return  <FormField
    control={form.control}
    name="settings.input"
    render={({ field }) => (
      <FormItem>
        <div className="pb-4">
          <ApMarkdown markdown={markdown} variant={MarkdownVariant.INFO} />
        </div>
        <div className="flex items-center justify-between">
          <FormLabel>{t('Inputs')}</FormLabel>
          {isCopilotEnabled && !params.readonly && (
            <AskAiButton
              onClick={() => {}}
              varitant={'ghost'}
              operation={{
                type: FlowOperationType.UPDATE_ACTION,
                stepName: selectedStep.name,
              }}
            ></AskAiButton>
          )}
        </div>

        <DictionaryProperty
          disabled={params.readonly}
          values={field.value}
          onChange={field.onChange}
          useMentionTextInput={true}
        ></DictionaryProperty>
        <FormMessage />
      </FormItem>
    )}
  />
  }

  const convertedProps = codePropsUtils.convertCodePropertyMapToPiecePropertyMap(props, piecesModels);
  const { authProps, nonAuthProps } = splitCodeProps(convertedProps);
  return (
    <div className="flex flex-col gap-4 w-full">
   
     {
      Object.keys(authProps).map((propName) => {
         const codeProp = props[propName];
         if(codeProp.type !== 'AUTH')
         {
          return null;
         }
         const piece = piecesModels[codeProp.pieceName];
         if(isNil(piece))
         {
          return<Skeleton key={propName} className="w-full h-8" />
         }
         return <ConnectionSelect
         key={propName}
         isTrigger={false}
         piece={piece}
         disabled={params.readonly}
         formControlName={propName}
         property={authProps[propName]}
       ></ConnectionSelect>

      })
     }
            <AutoPropertiesFormComponent
              prefixValue={'settings.input'}
              props={nonAuthProps}
              allowDynamicValues={true}
              disabled={params.readonly}
              useMentionTextInput={true}
            ></AutoPropertiesFormComponent>
   

    </div>
  );
});

CodePropsInputForm.displayName = 'CodePropsInputForm';
export { CodePropsInputForm };


