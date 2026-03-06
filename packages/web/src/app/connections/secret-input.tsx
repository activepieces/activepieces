import { SecretManagerFieldsSeparator } from '@activepieces/shared';
import { t } from 'i18next';
import { KeyRound } from 'lucide-react';
import * as React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input, InputProps } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { secretManagersHooks } from '@/features/secret-managers';
import { cn } from '@/lib/utils';

type SecretInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
  allowTogglingSecretManagerMode?: boolean;
  projectId?: string;
};

type SecretManagerToggleButtonProps = {
  isActive: boolean;
  onClick: () => void;
};

const SecretManagerToggleButton = React.memo(
  ({ isActive, onClick }: SecretManagerToggleButtonProps) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClick}
            className={cn('shrink-0', {
              'bg-primary/10': isActive,
            })}
          >
            <KeyRound
              className={cn('size-4', {
                'text-primary': isActive,
              })}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isActive ? t('Disable Secret Manager') : t('Use Secret Manager')}
        </TooltipContent>
      </Tooltip>
    );
  },
);

SecretManagerToggleButton.displayName = 'SecretManagerToggleButton';

const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  (
    {
      className,
      value,
      onChange,
      allowTogglingSecretManagerMode = true,
      projectId,
      ...restProps
    },
    ref,
  ) => {
    const { onBlur, name, disabled, ...otherProps } = restProps;

    const { data: connections } =
      secretManagersHooks.useListSecretManagerConnections({
        connectedOnly: true,
        projectId,
      });

    const { data: providers } = secretManagersHooks.useListProviders();

    const getSecretParamsForConnection = (connectionId: string | null) => {
      if (!connectionId || !connections || !providers) return [];
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) return [];
      const provider = providers.find((p) => p.id === connection.providerId);
      return provider?.secretParams ?? [];
    };

    const [showSecretManagerInput, setShowSecretInput] = useState(false);

    const [selectedConnectionId, setSelectedConnectionId] = useState<
      string | null
    >(null);

    useEffect(() => {
      if (connections && connections.length > 0 && !selectedConnectionId) {
        setSelectedConnectionId(connections[0].id);
      }
    }, [connections]);

    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const buildSecretValue = (
      connectionId: string | null,
      fieldValues: Record<string, string>,
    ): string => {
      const values = getSecretParamsForConnection(connectionId).map(
        (param) => fieldValues[param.name] || '',
      );
      const parts = [connectionId, ...values].join(
        SecretManagerFieldsSeparator,
      );
      return `{{${parts}}}`;
    };

    const toggleSecretManager = useCallback(() => {
      const newShowSecretInput = !showSecretManagerInput;
      setShowSecretInput(newShowSecretInput);

      if (newShowSecretInput) {
        const newValue = buildSecretValue(selectedConnectionId, fieldValues);
        onChange?.(newValue);
      } else {
        onChange?.('');
      }
    }, [showSecretManagerInput, selectedConnectionId, fieldValues, onChange]);

    const handleConnectionChange = useCallback(
      (newConnectionId: string) => {
        setSelectedConnectionId(newConnectionId);
        const newFieldValues: Record<string, string> = {};
        getSecretParamsForConnection(newConnectionId).forEach((param) => {
          newFieldValues[param.name] = '';
        });
        setFieldValues(newFieldValues);
        const newValue = buildSecretValue(newConnectionId, newFieldValues);
        onChange?.(newValue);
      },
      [onChange, connections, providers],
    );

    const handleFieldChange = useCallback(
      (fieldKey: string, fieldValue: string) => {
        const newFieldValues = { ...fieldValues, [fieldKey]: fieldValue };
        setFieldValues(newFieldValues);
        const newValue = buildSecretValue(selectedConnectionId, newFieldValues);
        onChange?.(newValue);
      },
      [fieldValues, selectedConnectionId, onChange],
    );

    const handleNormalInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.value);
      },
      [onChange],
    );

    const currentFields = useMemo(
      () => getSecretParamsForConnection(selectedConnectionId) || [],
      [selectedConnectionId, showSecretManagerInput, connections, providers],
    );

    const getProviderForConnection = (connectionId: string | null) => {
      if (!connectionId || !connections || !providers) return undefined;
      const connection = connections.find((c) => c.id === connectionId);
      return providers.find((p) => p.id === connection?.providerId);
    };

    const selectedConnection = connections?.find(
      (c) => c.id === selectedConnectionId,
    );
    const selectedProvider = getProviderForConnection(selectedConnectionId);

    if (selectedConnectionId && showSecretManagerInput) {
      return (
        <div className={cn('flex flex-col gap-2', className)}>
          <div className="flex items-center gap-2">
            <SecretManagerToggleButton
              isActive={true}
              onClick={toggleSecretManager}
            />
            <Select
              value={selectedConnectionId}
              onValueChange={handleConnectionChange}
            >
              <SelectTrigger className="w-64">
                {selectedConnection ? (
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedProvider?.logo && (
                      <img
                        src={selectedProvider.logo}
                        alt={selectedProvider.name}
                        className="size-4 shrink-0 object-contain"
                      />
                    )}
                    <span className="truncate">{selectedConnection.name}</span>
                  </div>
                ) : (
                  <SelectValue placeholder={t('Select connection')} />
                )}
              </SelectTrigger>
              <SelectContent>
                {connections?.map((connection) => {
                  const provider = providers?.find(
                    (p) => p.id === connection.providerId,
                  );
                  return (
                    <SelectItem key={connection.id} value={connection.id}>
                      <div className="flex items-center gap-2">
                        {provider?.logo && (
                          <img
                            src={provider.logo}
                            alt={provider.name}
                            className="size-4 shrink-0 object-contain"
                          />
                        )}
                        <span>{connection.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {currentFields.map((param) => (
              <Input
                key={param.name}
                placeholder={param.placeholder}
                value={fieldValues[param.name] || ''}
                onChange={(e) => handleFieldChange(param.name, e.target.value)}
                disabled={disabled}
                type="text"
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        {connections &&
          connections.length > 0 &&
          allowTogglingSecretManagerMode && (
            <SecretManagerToggleButton
              isActive={false}
              onClick={toggleSecretManager}
            />
          )}
        <Input
          ref={ref}
          name={name}
          onBlur={onBlur}
          disabled={disabled}
          className="flex-1"
          value={value || ''}
          onChange={handleNormalInputChange}
          type={otherProps.type}
        />
      </div>
    );
  },
);

SecretInput.displayName = 'SecretInput';

export { SecretInput, type SecretInputProps };
