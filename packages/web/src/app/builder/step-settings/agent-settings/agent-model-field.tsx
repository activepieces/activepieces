import { isNil } from '@activepieces/core-utils';
import { AgentProviderModel } from '@activepieces/shared';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';

import { aiModelHooks } from '@/features/agents/ai-model/hooks';
import { ModelPicker } from '@/features/agents/ai-model/model-picker';
import { projectCollectionUtils } from '@/features/projects';

import { agentModelUtils } from './agent-model-utils';

export function AgentModelField({
  value,
  onChange,
  pieceVersion,
  actionName,
  disabled,
  hideHeading = false,
}: AgentModelFieldProps) {
  const { surface, showHeading } = agentModelUtils.fieldFor({ actionName });
  const { project } = projectCollectionUtils.useCurrentProject();
  const withTiers = agentModelUtils.supportsTiers({ pieceVersion });
  const { data: options } = aiModelHooks.useModelOptions({
    projectId: project.id,
    surface,
  });
  const wroteDefault = useRef(false);

  useEffect(() => {
    if (
      disabled ||
      wroteDefault.current ||
      isNil(options) ||
      !agentModelUtils.isEmpty({ value })
    ) {
      return;
    }
    const choice = agentModelUtils.defaultFor({ options, withTiers });
    if (isNil(choice)) {
      return;
    }
    wroteDefault.current = true;
    onChange(agentModelUtils.valueOf({ choice }));
  }, [disabled, options, value, withTiers, onChange]);

  return (
    <div className="space-y-2">
      {showHeading && !hideHeading && (
        <h2 className="text-sm font-medium">{t('AI Model *')}</h2>
      )}
      <ModelPicker
        projectId={project.id}
        surface={surface}
        value={agentModelUtils.choiceOf({ value })}
        onChange={(choice) => onChange(agentModelUtils.valueOf({ choice }))}
        withTiers={withTiers}
        disabled={disabled}
      />
      {!withTiers && (options?.tiers.length ?? 0) > 0 && (
        <p className="text-xs text-gray-11">
          {t('Update this step to the latest version to use your tiers.')}
        </p>
      )}
    </div>
  );
}

type AgentModelFieldProps = {
  value: unknown;
  onChange: (value: AgentProviderModel) => void;
  pieceVersion: string;
  actionName: string;
  disabled: boolean;
  hideHeading?: boolean;
};
