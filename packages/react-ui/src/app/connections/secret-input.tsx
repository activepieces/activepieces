import { SecretManagerProviderId } from '@activepieces/ee-shared';
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
import { secretManagersHooks } from '@/features/secret-managers/lib/secret-managers-hooks';
import { cn } from '@/lib/utils';

type SecretInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
  allowTogglingSecretManagerMode: boolean;
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
      allowTogglingSecretManagerMode,
      ...restProps
    },
    ref,
  ) => {
    const { onBlur, name, disabled, ...otherProps } = restProps;

    const { data: secretManagers } = secretManagersHooks.useListSecretManagers({
      connectedOnly: true,
    });

    const getSecretParamsForProvider = (
      providerId: SecretManagerProviderId | null,
    ) =>
      Object.entries(
        secretManagers?.find((provider) => provider.id === providerId)
          ?.secretParams ?? {},
      );

    const [showSecretManagerInput, setShowSecretInput] = useState(false);

    const [selectedProvider, setSelectedProvider] =
      useState<SecretManagerProviderId | null>(null);

    useEffect(() => {
      if (secretManagers && secretManagers.length > 0) {
        setSelectedProvider(secretManagers[0].id);
      }
    }, [secretManagers]);

    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const buildSecretValue = (
      providerId: SecretManagerProviderId | null,
      fieldValues: Record<string, string>,
    ): string => {
      const values = getSecretParamsForProvider(providerId).map(
        ([fieldKey]) => fieldValues[fieldKey] || '',
      );
      return `{{${providerId}:${values.join(':')}}}`;
    };

    const toggleSecretManager = useCallback(() => {
      const newShowSecretInput = !showSecretManagerInput;
      setShowSecretInput(newShowSecretInput);

      if (newShowSecretInput) {
        const newValue = buildSecretValue(selectedProvider, fieldValues);
        onChange?.(newValue);
      } else {
        onChange?.('');
      }
    }, [showSecretManagerInput, selectedProvider, fieldValues, onChange]);

    const handleProviderChange = useCallback(
      (newProvider: SecretManagerProviderId) => {
        setSelectedProvider(newProvider);
        const newFieldValues: Record<string, string> = {};
        getSecretParamsForProvider(newProvider).forEach(([field]) => {
          newFieldValues[field] = '';
        });
        setFieldValues(newFieldValues);
        const newValue = buildSecretValue(newProvider, newFieldValues);
        onChange?.(newValue);
      },
      [onChange],
    );

    const handleFieldChange = useCallback(
      (fieldKey: string, fieldValue: string) => {
        const newFieldValues = { ...fieldValues, [fieldKey]: fieldValue };
        setFieldValues(newFieldValues);
        const newValue = buildSecretValue(selectedProvider, newFieldValues);
        onChange?.(newValue);
      },
      [fieldValues, selectedProvider, onChange],
    );

    const handleNormalInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.value);
      },
      [onChange],
    );

    const currentFields = useMemo(
      () => getSecretParamsForProvider(selectedProvider) || [],
      [selectedProvider, showSecretManagerInput],
    );

    if (selectedProvider && showSecretManagerInput) {
      return (
        <div className={cn('flex flex-col gap-2', className)}>
          <div className="flex items-center gap-2">
            <SecretManagerToggleButton
              isActive={true}
              onClick={toggleSecretManager}
            />
            <Select
              value={selectedProvider}
              onValueChange={(val) =>
                handleProviderChange(val as SecretManagerProviderId)
              }
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {secretManagers?.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentFields.map(([fieldKey, { placeholder }]) => (
              <Input
                key={fieldKey}
                placeholder={placeholder}
                value={fieldValues[fieldKey] || ''}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
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
        {secretManagers &&
          secretManagers.length > 0 &&
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
