import {
  ApFlagId,
  FileResponseInterface,
  FormInput,
  FormInputType,
  FormResponse,
  HumanInputFormResultTypes,
  HumanInputFormResult,
  createKeyForFormInput,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { z, ZodType } from 'zod';

import { FileInput } from '@/components/custom/file-input';
import { ApMarkdown } from '@/components/custom/markdown';
import { ReadMoreDescription } from '@/components/custom/read-more-description';
import { ShowPoweredBy } from '@/components/custom/show-powered-by';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

import { Checkbox } from '../../../components/ui/checkbox';
import { humanInputApi } from '../api/human-input-api';

type ApFormProps = {
  form: FormResponse;
  useDraft: boolean;
};
type FormInputWithName = FormInput & {
  name: string;
};

/**We do this because it was the behaviour in previous versions of Activepieces.*/
const putBackQuotesForInputNames = (
  value: Record<string, unknown>,
  inputs: FormInputWithName[],
) => {
  return inputs.reduce((acc, input) => {
    const key = createKeyForFormInput(input.displayName);
    acc[key] = value[key];
    return acc;
  }, {} as Record<string, unknown>);
};

const createPropertySchema = (input: FormInputWithName): ZodType => {
  switch (input.type) {
    case FormInputType.TOGGLE:
      return z.boolean();
    case FormInputType.TEXT:
    case FormInputType.TEXT_AREA:
      return input.required
        ? z.string().min(1, t('This field is required'))
        : z.string();
    case FormInputType.FILE:
      return input.required
        ? z
            .unknown()
            .refine(
              (value) => value instanceof File,
              t('This field is required'),
            )
        : z.unknown();
  }
};

function buildSchema(inputs: FormInputWithName[]) {
  return {
    properties: z.object(
      inputs.reduce<Record<string, ZodType>>((acc, input) => {
        acc[input.name] = createPropertySchema(input);
        return acc;
      }, {}),
    ),
    defaultValues: inputs.reduce<Record<string, string | boolean>>(
      (acc, input) => {
        acc[input.name] = input.type === FormInputType.TOGGLE ? false : '';
        return acc;
      },
      {},
    ),
  };
}
const isTruthyQueryValue = (value: string) =>
  ['true', '1', 'yes', 'on'].includes(value.toLowerCase());

const handleDownloadFile = (fileBase: FileResponseInterface) => {
  const link = document.createElement('a');
  if ('url' in fileBase) {
    link.href = fileBase.url;
  } else {
    link.download = fileBase.fileName;
    link.href = fileBase.base64Url;
    URL.revokeObjectURL(fileBase.base64Url);
  }
  link.target = '_blank';
  link.rel = 'noreferrer noopener';

  link.click();
};

const ApForm = ({ form, useDraft }: ApFormProps) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryParamsLowerCase = Array.from(queryParams.entries()).reduce(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const inputs = useRef<FormInputWithName[]>(
    form.props.inputs.map((input) => {
      return {
        ...input,
        name: createKeyForFormInput(input.displayName),
      };
    }),
  );

  const schema = buildSchema(inputs.current);

  const defaultValues = { ...schema.defaultValues };
  inputs.current.forEach((input) => {
    const queryValue = queryParamsLowerCase[input.name.toLowerCase()];
    if (queryValue !== undefined) {
      defaultValues[input.name] =
        input.type === FormInputType.TOGGLE
          ? isTruthyQueryValue(queryValue)
          : queryValue;
    }
  });

  const [markdownResponse, setMarkdownResponse] = useState<string | null>(null);
  const { data: showPoweredBy } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_POWERED_BY_IN_FORM,
  );
  const reactForm = useForm({
    defaultValues,
    resolver: zodResolver(schema.properties),
  });

  const { mutate, isPending } = useMutation<HumanInputFormResult | null, Error>(
    {
      mutationFn: async () =>
        humanInputApi.submitForm(
          form,
          useDraft,
          putBackQuotesForInputNames(reactForm.getValues(), inputs.current),
        ),
      onSuccess: (formResult) => {
        switch (formResult?.type) {
          case HumanInputFormResultTypes.MARKDOWN: {
            setMarkdownResponse(formResult.value as string);
            if (formResult.files) {
              formResult.files.forEach((file) => {
                handleDownloadFile(file as FileResponseInterface);
              });
            }
            break;
          }
          case HumanInputFormResultTypes.FILE:
            handleDownloadFile(formResult.value as FileResponseInterface);
            break;
          default:
            toast.success(t('Your submission was successfully received.'), {
              duration: 3000,
            });
            break;
        }
      },
      onError: (error) => {
        if (api.isError(error)) {
          const status = error.response?.status;
          if (status === 404) {
            toast.error(t('Flow not found'), {
              description: t(
                'The flow you are trying to submit to does not exist.',
              ),
              duration: 3000,
            });
          } else {
            toast.error(t('The flow failed to execute.'), {
              duration: 3000,
            });
          }
        }
        console.error(error);
      },
    },
  );
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-gray-1 px-4 py-12">
      <Form {...reactForm}>
        <form
          className="flex w-full max-w-lg flex-col gap-4"
          onSubmit={(e) => reactForm.handleSubmit(() => mutate())(e)}
        >
          <Card className="w-full gap-4 px-6 py-6">
            <h1 className="text-xl font-semibold text-gray-12">
              {form?.title}
            </h1>
            <div className="flex flex-col gap-4">
              {inputs.current.map((input) => {
                return (
                  <FormField
                    key={input.name}
                    control={reactForm.control}
                    name={input.name}
                    render={({ field }) => (
                      <>
                        {input.type === FormInputType.TOGGLE && (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  id={input.name}
                                  onCheckedChange={(e) => field.onChange(e)}
                                  checked={field.value === true}
                                ></Checkbox>
                              </FormControl>
                              <FormLabel
                                htmlFor={input.name}
                                className="flex items-center gap-1"
                                showRequiredIndicator={input.required}
                              >
                                {input.displayName}
                              </FormLabel>
                            </div>
                            {input.description && (
                              <ReadMoreDescription text={input.description} />
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                        {input.type !== FormInputType.TOGGLE && (
                          <FormItem>
                            <FormLabel
                              htmlFor={input.name}
                              className="flex items-center gap-1"
                              showRequiredIndicator={input.required}
                            >
                              {input.displayName}
                            </FormLabel>
                            {input.type === FormInputType.TEXT_AREA && (
                              <FormControl>
                                <Textarea
                                  {...field}
                                  name={input.name}
                                  id={input.name}
                                  onChange={field.onChange}
                                  value={String(field.value ?? '')}
                                />
                              </FormControl>
                            )}
                            {input.type === FormInputType.TEXT && (
                              <FormControl>
                                <Input
                                  {...field}
                                  onChange={field.onChange}
                                  id={input.name}
                                  name={input.name}
                                  value={String(field.value ?? '')}
                                />
                              </FormControl>
                            )}
                            {input.type === FormInputType.FILE && (
                              <FormControl>
                                <FileInput
                                  name={input.name}
                                  id={input.name}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      field.onChange(file);
                                    }
                                  }}
                                />
                              </FormControl>
                            )}
                            {input.description && (
                              <ReadMoreDescription text={input.description} />
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      </>
                    )}
                  />
                );
              })}
            </div>
            <Button type="submit" className="w-full" loading={isPending}>
              {t('Submit')}
            </Button>
            {markdownResponse && (
              <>
                <Separator />
                <ApMarkdown markdown={markdownResponse} />
              </>
            )}
          </Card>
          <ShowPoweredBy position="static" show={showPoweredBy ?? false} />
        </form>
      </Form>
    </main>
  );
};

ApForm.displayName = 'ApForm';
export { ApForm };
