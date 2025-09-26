import { t } from 'i18next';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Sparkles, X, FormInput, Wand2 } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { propertyUtils } from './property-utils';
import { isNil, PropertyExecutionType, PropertySettings } from '@activepieces/shared';
import { PiecePropertyMap, OAuth2Props, ArraySubProps } from '@activepieces/pieces-framework';
import { autoPropertiesUtils } from '@/features/pieces/lib/auto-properties-utils';
import { TooltipContent, Tooltip, TooltipTrigger } from '@/components/ui/tooltip';

type AutoFieldsAccordionProps = {
  props: PiecePropertyMap | OAuth2Props | ArraySubProps<boolean>;
  prefixValue: string;
  disabled?: boolean;
};

const AutoFieldsAccordion = React.memo(({ props, prefixValue, disabled }: AutoFieldsAccordionProps) => {
  const form = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const propertySettings = form.getValues().settings?.propertySettings;
  
  const autoProperties = Object.entries(propertySettings || {}).filter(([, data]) => (data as PropertySettings)?.type === PropertyExecutionType.AUTO);
  const autoFields = autoProperties;

  const handleAutoFillAll = () => {
    Object.entries(propertySettings).forEach(([propertyName]) => {
      const currentProperty = propertySettings[propertyName].schema ?? props[propertyName];
      const mode = isNil(props[propertyName]) && propertyName !== 'auth' ? PropertyExecutionType.AUTO : autoPropertiesUtils.determinePropertyExecutionType(propertyName, currentProperty, props);

      switch (mode) {
        case PropertyExecutionType.DYNAMIC:
          propertyUtils.handleDynamicValueToggleChange({
            form,
            mode: PropertyExecutionType.DYNAMIC,
            propertyName,
            property: currentProperty,
            inputName: `${prefixValue}.${propertyName}`,
          });
          break;
        case PropertyExecutionType.AUTO: 
        case PropertyExecutionType.MANUAL:
          propertyUtils.handleDynamicValueToggleChange({
            form,
            mode,
            propertyName,
          });
          break;
      }
    });
  };

  const handleClearAll = () => {
    Object.entries(propertySettings).forEach(([propertyName]) => {
      propertyUtils.handleDynamicValueToggleChange({
        form,
        mode: PropertyExecutionType.MANUAL,
        propertyName,
      });
    });
  };

  return (
    <div className="sticky bottom-0 px-4 pb-4 bg-white z-50">
     <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      <div style={{
        background: 'conic-gradient(from 180deg at 50% 50%, #6217D6 0deg, #6217D6 50.19deg, #3DA8FF 95.19deg, #3DA8FF 202.56deg, rgba(61, 168, 255, 0.2) 236.33deg, rgba(198, 23, 214, 0.2) 281.26deg, #C617D6 286.94deg, #C617D6 335.39deg, #6217D6 360deg)',
        borderRadius: '8px',
        padding: '1px',
      }}>
        <Accordion 
          type="single" 
          collapsible 
          value={isOpen ? "auto" : ""}
          onValueChange={(value) => setIsOpen(value === "auto")}
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 58.17%, #F5F2FA 100%)',
            borderRadius: '7px',
            border: 'none',
          }}
        >
          <AccordionItem value="auto" className="border-none">
            <AccordionTrigger>
              <div className="flex items-center gap-3 w-full">
               <Sparkles className="size-4 text-purple-700" />
                <div className="flex flex-col gap-1">
                  <span className="text-purple-700">{t('Auto filled by AI')}</span>
                  {!isOpen && (
                    autoFields.length > 0 ? (
                    (() => {
                      const firstFourFields = autoFields.slice(0, 4);
                      const remainingCount = autoFields.length - 4;
                      const fullFieldNames = firstFourFields.map(([propertyName]) => t(propertyName)).join(', ');
                      const maxLength = remainingCount > 0 ? 30 : 45;
                      const fieldNames = fullFieldNames.length > maxLength 
                        ? fullFieldNames.slice(0, maxLength - 3) + '...'
                        : fullFieldNames;
                      
                      return (
                        <div className="text-[10px] text-purple-900">
                          {fieldNames}
                          {remainingCount > 0 && ` + ${remainingCount} more`}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {t('No fields are filled with AI')}
                    </div>
                  )
                  )}
                </div>

              </div>
              {autoFields.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAll();
                  }}
                  disabled={disabled}
                  className="h-6 px-2 text-xs mr-1 text-slate-500"
                >
                  {t('Clear all')}
                </Button>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              {autoFields.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {autoFields.map(([propertyName]) => {
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 w-full group" onClick={(e) => {
                              e.stopPropagation();
                              propertyUtils.handleDynamicValueToggleChange({
                                form,
                                mode: PropertyExecutionType.MANUAL,
                                propertyName,
                              });
                            }}>
                            <div key={propertyName} className="w-full flex items-center justify-between text-xs transition-all duration-300 py-1 px-2 rounded-sm cursor-pointer border border-slate-300 group-hover:bg-white group-hover:border-slate-400">
                              <div className="flex items-center gap-2">
                                <FormInput className="h-4 w-4 text-muted-foreground" />
                                <p>{t(props[propertyName]?.displayName ?? propertyName)}</p>
                              </div>
                            </div>
                            <X className="h-4 w-4 text-slate-300 transition-all duration-300 group-hover:text-slate-400 shrink-0 cursor-pointer" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {t('Enter Manually')}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4">
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="size-4 text-muted-foreground" />
                      <span>{t('No fields are filled with AI')}</span>
                    </div>
                    <p className="text-xs">
                      {t('Click the')} <Sparkles className="inline size-3 text-primary" /> {t('icon to auto fill a field with AI')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFillAll}
                    disabled={disabled}
                    className="w-full"
                  >
                    <Wand2 className="size-4 mr-2" />
                    {t('Auto-fill all')}
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
});

AutoFieldsAccordion.displayName = 'AutoFieldsAccordion';
export { AutoFieldsAccordion };
