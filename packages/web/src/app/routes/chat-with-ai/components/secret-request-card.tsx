import { isNil, tryCatch } from '@activepieces/core-utils';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { chatApi } from '@/features/chat/lib/chat-api';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { chatDemo } from '@/features/chat/lib/demo/chat-demo';
import { demoCapabilities } from '@/features/chat/lib/demo/demo-capability-scenarios';
import { piecesHooks } from '@/features/pieces';
import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';
import { aiProviderKeys } from '@/features/platform-admin/hooks/ai-provider-hooks';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';
import {
  SaveFailure,
  SecretField,
  SecretRef,
  SecretRequest,
  secretRequestUtils,
} from '../lib/secret-request';

import { InteractiveCardShell } from './interactive-card-shell';

export function SecretRequestCard({
  toolCallId,
  input,
  expired,
  onFollowUp,
}: {
  toolCallId: string;
  input: unknown;
  expired: boolean;
  onFollowUp: (text: string) => void;
}) {
  const request = useMemo(() => secretRequestUtils.parse(input), [input]);
  const approveGate = useChatStoreContext((s) => s.approveGate);
  const dismissGate = useChatStoreContext((s) => s.dismissGate);
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const pieceName =
    request?.target === 'connection' && request.piece
      ? normalizePieceName(request.piece)
      : '';
  const { pieceModel, isLoading: pieceLoading } = piecesHooks.usePiece({
    name: pieceName,
    enabled: pieceName !== '',
  });

  const isDemo = chatDemo.isDemoId(toolCallId);
  const { data: providerConfigs } = useQuery({
    queryKey: aiProviderKeys.configs,
    queryFn: () => aiProviderApi.listConfigs(),
    enabled: request?.target === 'ai_provider' && !isDemo,
    retry: false,
  });

  useEffect(() => () => setValues({}), []);

  if (!request) return null;

  const existingKey = secretRequestUtils.existingProviderKey({
    request,
    configs: providerConfigs,
  });
  const inline =
    secretRequestUtils.canSaveInline(request) &&
    (request.target !== 'connection' ||
      isDemo ||
      pieceLoading ||
      secretRequestUtils.connectionAuth({
        piece: pieceModel,
        fields: request.fields,
      }) !== null);
  const filled = request.fields.every(
    (field) => (values[field.name] ?? '').trim().length > 0,
  );
  const canSave =
    inline &&
    filled &&
    status !== 'saving' &&
    (isDemo || request.target !== 'connection' || !pieceLoading);

  const notNow = () => {
    setValues({});
    if (expired) {
      dismissGate(toolCallId);
      return;
    }
    approveGate(toolCallId, { saved: false, reason: 'dismissed' });
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (!isNil(existingKey) && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    setStatus('saving');
    const { data: ref, error } = await tryCatch<SecretRef>(() =>
      isDemo
        ? demoCapabilities.saveSecret({ request, values })
        : secretRequestUtils.save({
            request,
            values,
            piece: pieceModel,
            replace: existingKey,
          }),
    );
    if (error || !ref) {
      setFailure(secretRequestUtils.failureOf(error));
      setStatus('failed');
      return;
    }
    setValues({});
    const resolved =
      !expired &&
      !(
        await tryCatch(() =>
          chatApi.approveToolCall({
            gateId: toolCallId,
            approved: true,
            payload: { saved: true, ref: { kind: ref.kind, id: ref.id } },
          }),
        )
      ).error;
    dismissGate(toolCallId);
    if (!resolved) {
      onFollowUp(t('Saved {name} key', { name: request.name }));
    }
  };

  return (
    <InteractiveCardShell
      onDismiss={notNow}
      title={
        <div className="flex items-center gap-2">
          <Lock className="size-4 shrink-0 text-gray-11" aria-hidden />
          <h3 className="text-base font-semibold leading-snug text-gray-12">
            {request.title}
          </h3>
        </div>
      }
    >
      <p className="pb-3 text-sm text-gray-11">
        {expired
          ? t(
              'This request timed out. You can still save the key and I will pick it up.',
            )
          : request.reason ??
            t('The key goes straight to {name} settings. I never see it.', {
              name: request.name,
            })}
      </p>
      {inline ? (
        <div className="flex flex-col gap-3">
          {request.fields.map((field, index) => (
            <SecretInput
              key={field.name}
              field={field}
              index={index}
              value={values[field.name] ?? ''}
              disabled={status === 'saving'}
              invalid={status === 'failed'}
              onChange={(value) => {
                setValues((prev) => ({ ...prev, [field.name]: value }));
                setConfirmReplace(false);
                if (status === 'failed') setStatus('idle');
              }}
              onEnter={() => {
                handleSave().catch(() => undefined);
              }}
            />
          ))}
          {status === 'failed' && (
            <p role="alert" className="text-sm text-danger-11">
              {failure === 'forbidden'
                ? t("You don't have permission to save this key.")
                : t("That key didn't work. Check it and try again.")}
            </p>
          )}
          {confirmReplace && status !== 'failed' && (
            <p role="alert" className="text-sm text-warning-11">
              {t('Replace the existing {name} key?', { name: request.name })}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-11">
          {t('This key can only be added in settings.')}
        </p>
      )}
      <div className="mt-4 flex items-center gap-2 border-t pt-3">
        {inline ? (
          <Button
            size="sm"
            type="button"
            className="gap-1.5"
            disabled={!canSave}
            onClick={() => {
              handleSave().catch(() => undefined);
            }}
          >
            {status === 'saving' ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3.5" aria-hidden />
            )}
            {status === 'saving'
              ? t('Saving…')
              : confirmReplace
              ? t('Replace key')
              : t('Save')}
          </Button>
        ) : (
          <Button
            size="sm"
            type="button"
            onClick={() => navigate(secretRequestUtils.settingsPath(request))}
          >
            {t('Open settings')}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={confirmReplace ? () => setConfirmReplace(false) : notNow}
          disabled={status === 'saving'}
        >
          {confirmReplace ? t('Cancel') : t('Not now')}
        </Button>
      </div>
    </InteractiveCardShell>
  );
}

export function SecretSavedLine({ request }: { request: SecretRequest }) {
  return (
    <div className="flex items-center gap-1.5 py-1 text-xs text-gray-11">
      <Check className="size-3.5 shrink-0 text-success-11" aria-hidden />
      <span>{t('Saved {name}', { name: request.title })}</span>
    </div>
  );
}

function SecretInput({
  field,
  index,
  value,
  disabled,
  invalid,
  onChange,
  onEnter,
}: {
  field: SecretField;
  index: number;
  value: string;
  disabled: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const secret = field.type === 'password';
  const hintId = field.hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-gray-12">
        {field.label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={`ap-chat-entry-${index}`}
          type={secret && !shown ? 'password' : 'text'}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          data-1p-ignore=""
          data-lpignore="true"
          data-form-type="other"
          value={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              onEnter();
            }
          }}
          className={cn(
            'h-9 w-full rounded-md border border-gray-6 bg-gray-1 px-3 text-sm text-gray-12 outline-none transition-colors placeholder:text-gray-9 focus-visible:border-gray-8 focus-visible:ring-1 focus-visible:ring-gray-8 disabled:opacity-60',
            secret && 'pr-9 font-mono',
            invalid && 'border-danger-9 focus-visible:border-danger-9',
          )}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShown((prev) => !prev)}
            aria-label={shown ? t('Hide value') : t('Show value')}
            aria-pressed={shown}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-gray-11 transition-colors hover:text-gray-12 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8"
          >
            {shown ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        )}
      </div>
      {field.hint && (
        <p id={hintId} className="text-xs text-gray-11">
          {field.hint}
        </p>
      )}
    </div>
  );
}

type SaveStatus = 'idle' | 'saving' | 'failed';
