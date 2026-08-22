import { t } from 'i18next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import React, { useState } from 'react';
import { useFormState } from 'react-hook-form';

import { formErrorUtils } from '@/app/builder/piece-properties/form-error-utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ConfigIndex, type ConfigSectionState } from './config-index';
import { type ConfigSection } from './config-sections';

function ConfigNavigator({
  sections,
  requiredNamesByKey,
  prefixValue,
  renderSection,
}: ConfigNavigatorProps) {
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? '');
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.key === activeKey),
  );
  const activeSection = sections[activeIndex];

  const allPaths = sections.flatMap((section) =>
    section.propNames.map((name) => `${prefixValue}.${name}`),
  );
  const { errors, touchedFields, dirtyFields } = useFormState({
    name: allPaths,
  });

  const stateByKey = Object.fromEntries(
    sections.map((section) => [
      section.key,
      sectionStateOf({
        section,
        requiredNames: requiredNamesByKey[section.key] ?? [],
        prefixValue,
        errors: errors as Record<string, unknown>,
        touchedFields: touchedFields as Record<string, unknown>,
        dirtyFields: dirtyFields as Record<string, unknown>,
      }),
    ]),
  );

  const isLast = activeIndex === sections.length - 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <aside className="w-[196px] min-h-0 shrink-0 overflow-y-auto border-r border-border pr-2">
          <ConfigIndex
            sections={sections}
            activeKey={activeSection?.key ?? ''}
            stateByKey={stateByKey}
            showDescriptions
            onSelect={setActiveKey}
          />
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
          {activeSection && (
            <header className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t(activeSection.label)}
              </h3>
              {activeSection.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(activeSection.description)}
                </p>
              )}
            </header>
          )}
          {sections.map((section) => (
            <div
              key={section.key}
              hidden={section.key !== activeSection?.key}
              className="min-w-0"
            >
              {renderSection(section)}
            </div>
          ))}
        </div>
      </div>

      <footer
        className={cn(
          'mt-5 flex shrink-0 items-center justify-between',
          'border-t border-border pt-3',
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={activeIndex === 0}
          onClick={() => setActiveKey(sections[activeIndex - 1].key)}
        >
          <ArrowLeft className="size-4" />
          {t('Back')}
        </Button>
        {isLast ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="size-3.5" />
            {t('Last section')}
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveKey(sections[activeIndex + 1].key)}
          >
            {t('Next')}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </footer>
    </div>
  );
}

ConfigNavigator.displayName = 'ConfigNavigator';

function sectionStateOf({
  section,
  requiredNames,
  prefixValue,
  errors,
  touchedFields,
  dirtyFields,
}: {
  section: ConfigSection;
  requiredNames: string[];
  prefixValue: string;
  errors: Record<string, unknown>;
  touchedFields: Record<string, unknown>;
  dirtyFields: Record<string, unknown>;
}): ConfigSectionState {
  const paths = section.propNames.map((name) => `${prefixValue}.${name}`);
  if (formErrorUtils.hasTouchedErrorUnder({ errors, touchedFields, paths })) {
    return 'error';
  }
  if (section.kind === 'test' || paths.length === 0) {
    return 'pending';
  }
  const requiredPaths = requiredNames.map((name) => `${prefixValue}.${name}`);
  const hasRequiredError = formErrorUtils.hasErrorUnder({
    errors,
    paths: requiredPaths,
  });
  if (requiredPaths.length > 0) {
    return hasRequiredError ? 'pending' : 'complete';
  }
  const touched = formErrorUtils.getTouchedPaths(dirtyFields, '');
  const anyFilled = paths.some((path) =>
    touched.some((dirtyPath) => dirtyPath.startsWith(path)),
  );
  return anyFilled ? 'complete' : 'pending';
}

export { ConfigNavigator };

type ConfigNavigatorProps = {
  sections: ConfigSection[];
  requiredNamesByKey: Record<string, string[]>;
  prefixValue: string;
  renderSection: (section: ConfigSection) => React.ReactNode;
};
