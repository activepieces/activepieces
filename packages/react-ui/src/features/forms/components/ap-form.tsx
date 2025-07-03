import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { TSchema, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';

import { ApMarkdown } from '@/components/custom/markdown';
import { ShowPoweredBy } from '@/components/show-powered-by';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
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

import { Checkbox } from '../../../components/ui/checkbox';
import { humanInputApi } from '../lib/human-input-api';

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

const requiredPropertySettings = {
  minLength: 1,
  errorMessage: t('This field is required'),
};

const createPropertySchema = (input: FormInputWithName) => {
  const schemaSettings = input.required ? requiredPropertySettings : {};
  switch (input.type) {
    case FormInputType.TOGGLE:
      return Type.Boolean(schemaSettings);
    case FormInputType.TEXT:
    case FormInputType.TEXT_AREA:
      return Type.String(schemaSettings);
    case FormInputType.FILE:
      return Type.Unknown(schemaSettings);
  }
};

function buildSchema(inputs: FormInputWithName[]) {
  return {
    properties: Type.Object(
      inputs.reduce<Record<string, TSchema>>((acc, input) => {
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
      defaultValues[input.name] = queryValue;
    }
  });

  const [markdownResponse, setMarkdownResponse] = useState<string | null>(null);
  const { data: showPoweredBy } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_POWERED_BY_IN_FORM,
  );
  const reactForm = useForm({
    defaultValues,
    resolver: typeboxResolver(schema.properties),
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
            toast({
              title: t('Success'),
              description: t('Your submission was successfully received.'),
              duration: 3000,
            });
            break;
        }
      },
      onError: (error) => {
        if (api.isError(error)) {
          const status = error.response?.status;
          if (status === 404) {
            toast({
              title: t('Flow not found'),
              description: t(
                'The flow you are trying to submit to does not exist.',
              ),
              duration: 3000,
            });
          } else {
            toast({
              title: t('Error'),
              description: t('The flow failed to execute.'),
              duration: 3000,
            });
          }
        }
        console.error(error);
      },
    },
  );
  return (
    <div className="w-full h-full flex">
      <div className="container py-20">
        <Form {...reactForm}>
          <form onSubmit={(e) => reactForm.handleSubmit(() => mutate())(e)}>
            <Card className="w-[500px] mx-auto">
              <CardHeader>
                <CardTitle className="text-center">{form?.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid w-full items-center gap-3">
                  {inputs.current.map((input) => {
                    return (
                      <FormField
                        key={input.name}
                        control={reactForm.control}
                        name={input.name}
                        render={({ field }) => (
                          <>
                            {input.type === FormInputType.TOGGLE && (
                              <>
                                <FormItem className="flex items-center gap-2 h-full">
                                  <FormControl>
                                    <Checkbox
                                      onCheckedChange={(e) => field.onChange(e)}
                                      checked={field.value as boolean}
                                    ></Checkbox>
                                  </FormControl>
                                  <FormLabel
                                    htmlFor={input.name}
                                    className="flex items-center"
                                  >
                                    {input.displayName}
                                  </FormLabel>
                                </FormItem>
                                <ReadMoreDescription
                                  text={input.description ?? ''}
                                />
                              </>
                            )}
                            {input.type !== FormInputType.TOGGLE && (
                              <FormItem className="flex flex-col gap-1">
                                <FormLabel
                                  htmlFor={input.name}
                                  className="flex items-center justify-between"
                                >
                                  {input.displayName} {input.required && '*'}
                                </FormLabel>
                                <FormControl className="flex flex-col gap-1">
                                  <>
                                    {input.type === FormInputType.TEXT_AREA && (
                                      <Textarea
                                        {...field}
                                        name={input.name}
                                        id={input.name}
                                        onChange={field.onChange}
                                        value={
                                          field.value as string | undefined
                                        }
                                      />
                                    )}
                                    {input.type === FormInputType.TEXT && (
                                      <Input
                                        {...field}
                                        onChange={field.onChange}
                                        id={input.name}
                                        name={input.name}
                                        value={
                                          field.value as string | undefined
                                        }
                                      />
                                    )}
                                    {input.type === FormInputType.FILE && (
                                      <Input
                                        name={input.name}
                                        id={input.name}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            field.onChange(file);
                                          }
                                        }}
                                        placeholder={input.displayName}
                                        type="file"
                                      />
                                    )}
                                    <ReadMoreDescription
                                      text={input.description ?? ''}
                                    />
                                  </>
                                </FormControl>
                              </FormItem>
                            )}
                          </>
                        )}
                      />
                    );
                  })}
                </div>
                <Button
                  type="submit"
                  className="w-full mt-4"
                  loading={isPending}
                >
                  {t('Submit')}
                </Button>

                {markdownResponse && (
                  <>
                    <Separator className="my-4" />
                    <ApMarkdown markdown={markdownResponse} />
                  </>
                )}
              </CardContent>
            </Card>
            <div className="mt-2">
              <ShowPoweredBy position="static" show={showPoweredBy ?? false} />
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

ApForm.displayName = 'ApForm';
export { ApForm };
