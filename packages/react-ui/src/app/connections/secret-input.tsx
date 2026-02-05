import { KeyRound } from 'lucide-react';
import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';

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
import { SecretManagerProviderId } from '@activepieces/shared';

type SecretInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
};

const SECRET_VALUE_REGEX = /^\{\{\s*(\w+):(.*)\s*\}\}$/;

const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  ({ className, value, onChange, ...restProps }, ref) => {
    // Extract only the props we want to pass to inner inputs (exclude potential conflicting ones)
    const { onBlur, name, disabled, ...otherProps } = restProps;

    const { data: secretManagers } = secretManagersHooks.useSecretManagers({
      connectedOnly: true,
    });

    const providerGetSecretParams = (providerId: SecretManagerProviderId) =>
      Object.entries(
        secretManagers?.find((provider) => provider.id === providerId)
          ?.getSecretParams ?? {},
      );

    const parseSecretValue = (
      value: string | undefined,
    ): {
      isSecretManager: boolean;
      providerId: SecretManagerProviderId;
      fieldValues: Record<string, string>;
    } => {
      const defaultOptions = {
        isSecretManager: false,
        providerId: SecretManagerProviderId.HASHICORP,
        fieldValues: {},
      };
      if (!value) {
        return defaultOptions;
      }

      const match = value.match(SECRET_VALUE_REGEX);
      if (!match) {
        return defaultOptions;
      }

      const [, providerId, valuesString] = match;
      const providerIdTyped = providerId as SecretManagerProviderId;
      const fields = providerGetSecretParams(providerIdTyped);
      const values = valuesString.split(':');

      const fieldValues: Record<string, string> = {};
      fields.forEach(([fieldKey], index) => {
        fieldValues[fieldKey] = values[index] || '';
      });

      return {
        isSecretManager: true,
        providerId: providerIdTyped,
        fieldValues,
      };
    };

    const parsed = useMemo(() => parseSecretValue(value), [value]);

    const [useSecretManager, setUseSecretManager] = useState(
      parsed.isSecretManager,
    );
    const [selectedProvider, setSelectedProvider] =
      useState<SecretManagerProviderId>(parsed.providerId);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>(
      parsed.fieldValues,
    );

    const buildSecretValue = (
      providerId: SecretManagerProviderId,
      fieldValues: Record<string, string>,
    ): string => {
      const values = providerGetSecretParams(providerId).map(
        ([fieldKey]) => fieldValues[fieldKey] || '',
      );
      return `{{${providerId}:${values.join(':')}}}`;
    };

    const toggleSecretManager = useCallback(() => {
      const newUseSecretManager = !useSecretManager;
      setUseSecretManager(newUseSecretManager);

      if (newUseSecretManager) {
        // Switching to secret manager mode - build initial value
        const newValue = buildSecretValue(selectedProvider, fieldValues);
        onChange?.(newValue);
      } else {
        // Switching to normal mode - clear value
        onChange?.('');
      }
    }, [useSecretManager, selectedProvider, fieldValues, onChange]);

    const handleProviderChange = useCallback(
      (newProvider: SecretManagerProviderId) => {
        setSelectedProvider(newProvider);
        // Reset field values when provider changes
        const newFieldValues: Record<string, string> = {};
        providerGetSecretParams(newProvider).forEach(([field]) => {
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
      () => providerGetSecretParams(selectedProvider) || [],
      [selectedProvider, useSecretManager],
    );

    if (useSecretManager) {
      return (
        <div className={cn('flex flex-col gap-2', className)}>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleSecretManager}
                  className="shrink-0 bg-primary/10"
                >
                  <KeyRound className="size-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Use Secret Manager</TooltipContent>
            </Tooltip>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleSecretManager}
              className="shrink-0"
            >
              <KeyRound className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Use Secret Manager</TooltipContent>
        </Tooltip>
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
