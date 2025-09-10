import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowLeft, GitCompare, Plus, Minus, Edit } from 'lucide-react';
import React, { useState } from 'react';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { formatUtils } from '@/lib/utils';
import {
  FlowVersion,
  FlowVersionMetadata,
  flowStructureUtil,
  Step,
} from '@activepieces/shared';

type StepChangeType = 'added' | 'deleted' | 'modified' | 'unchanged';

interface StepChange {
  step: Step;
  changeType: StepChangeType;
  oldStep?: Step;
}

interface FlowVersionComparisonProps {
  version1: FlowVersionMetadata;
  version2: FlowVersionMetadata;
  onBack?: () => void;
}

const FlowVersionComparison: React.FC<FlowVersionComparisonProps> = ({
  version1,
  version2,
  onBack,
}) => {
  const [, setLeftSidebar] = useBuilderStateContext((state) => [
    state.setLeftSidebar,
  ]);

  const [selectedVersion1, setSelectedVersion1] = useState<FlowVersionMetadata>(version1);
  const [selectedVersion2, setSelectedVersion2] = useState<FlowVersionMetadata>(version2);

  // Fetch full flow version data for both versions
  const { data: flowVersion1, isLoading: isLoading1 } = useQuery<FlowVersion>({
    queryKey: ['flow-version', selectedVersion1.id],
    queryFn: async () => {
      const result = await flowsApi.get(selectedVersion1.flowId, {
        versionId: selectedVersion1.id,
      });
      return result.version;
    },
    enabled: !!selectedVersion1,
  });

  const { data: flowVersion2, isLoading: isLoading2 } = useQuery<FlowVersion>({
    queryKey: ['flow-version', selectedVersion2.id],
    queryFn: async () => {
      const result = await flowsApi.get(selectedVersion2.flowId, {
        versionId: selectedVersion2.id,
      });
      return result.version;
    },
    enabled: !!selectedVersion2,
  });

  const compareVersions = (): StepChange[] => {
    if (!flowVersion1 || !flowVersion2) return [];

    const steps1 = flowStructureUtil.getAllSteps(flowVersion1.trigger);
    const steps2 = flowStructureUtil.getAllSteps(flowVersion2.trigger);

    const changes: StepChange[] = [];
    const stepMap1 = new Map(steps1.map(step => [step.name, step]));
    const stepMap2 = new Map(steps2.map(step => [step.name, step]));

    // Find added and modified steps
    steps2.forEach(step2 => {
      const step1 = stepMap1.get(step2.name);
      if (!step1) {
        changes.push({ step: step2, changeType: 'added' });
      } else if (JSON.stringify(step1) !== JSON.stringify(step2)) {
        changes.push({ step: step2, changeType: 'modified', oldStep: step1 });
      } else {
        changes.push({ step: step2, changeType: 'unchanged' });
      }
    });

    // Find deleted steps
    steps1.forEach(step1 => {
      if (!stepMap2.has(step1.name)) {
        changes.push({ step: step1, changeType: 'deleted' });
      }
    });

    return changes.sort((a, b) => {
      // Sort by change type: added, modified, deleted, unchanged
      const order = { added: 0, modified: 1, deleted: 2, unchanged: 3 };
      return order[a.changeType] - order[b.changeType];
    });
  };

  const changes = compareVersions();
  const isLoading = isLoading1 || isLoading2;

  const getChangeIcon = (changeType: StepChangeType) => {
    switch (changeType) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'deleted':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType: StepChangeType) => {
    switch (changeType) {
      case 'added':
        return 'border-l-green-500 bg-green-50';
      case 'deleted':
        return 'border-l-red-500 bg-red-50';
      case 'modified':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-200';
    }
  };

  const getChangeText = (changeType: StepChangeType) => {
    switch (changeType) {
      case 'added':
        return t('Added');
      case 'deleted':
        return t('Deleted');
      case 'modified':
        return t('Modified');
      default:
        return t('Unchanged');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack || (() => setLeftSidebar(LeftSideBarType.VERSIONS))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <GitCompare className="h-5 w-5" />
          <span className="font-medium">{t('Version Comparison')}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">{t('Loading...')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack || (() => setLeftSidebar(LeftSideBarType.VERSIONS))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <GitCompare className="h-5 w-5" />
        <span className="font-medium">{t('Version Comparison')}</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {t('Version')} {formatUtils.formatDate(new Date(selectedVersion1.created))}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                {selectedVersion1.state} • {selectedVersion1.displayName}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {t('Version')} {formatUtils.formatDate(new Date(selectedVersion2.created))}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                {selectedVersion2.state} • {selectedVersion2.displayName}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('Step Changes')}</h3>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {changes.map((change, index) => (
                <Card
                  key={`${change.step.name}-${index}`}
                  className={`border-l-4 ${getChangeColor(change.changeType)}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      {getChangeIcon(change.changeType)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {change.step.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({change.step.name})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getChangeText(change.changeType)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export { FlowVersionComparison };
