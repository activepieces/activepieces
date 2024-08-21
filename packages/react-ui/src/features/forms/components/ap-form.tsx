import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Static, TObject, TSchema, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import {
  FileResponseInterface,
  FormInput,
  FormInputType,
  FormResponse,
} from '@activepieces/shared';

import { FormResult, FormResultTypes, formsApi } from '../lib/forms-api';

type ApFormProps = {
  form: FormResponse;
  useDraft: boolean;
};

function buildSchema(inputs: FormInput[]): TObject {
  const properties = inputs.reduce<Record<string, TSchema>>((acc, input) => {
    switch (input.type) {
      case FormInputType.FILE:
        acc[input.displayName] = Type.String();
        break;
      case FormInputType.TEXT:
      case FormInputType.TEXT_AREA:
        acc[input.displayName] = Type.String();
        break;
      case FormInputType.TOGGLE:
        acc[input.displayName] = Type.Boolean();
        break;
      default:
        break;
    }
    return acc;
  }, {});
  return Type.Object(properties);
}

const handleDownloadFile = (formResult: FormResult) => {
  const link = document.createElement('a');
  const fileBase = formResult.value as FileResponseInterface;
  link.download = fileBase.fileName;
  link.href = fileBase.base64Url;
  link.target = '_blank';
  link.rel = 'noreferrer noopener';

  link.click();
  URL.revokeObjectURL(fileBase.base64Url);
};

const fileToBase64 = (
  file: File,
  callback: (result: string | ArrayBuffer | null) => void,
) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = () => {
    callback(reader.result);
  };
};

const ApForm = ({ form, useDraft }: ApFormProps) => {
  const schema = buildSchema(form.props.inputs);

  const [markdownResponse, setMarkdownResponse] = useState<string | null>(null);

  const reactForm = useForm<Static<typeof schema>>({
    defaultValues: {},
    resolver: typeboxResolver(schema),
  });

  const { mutate: submitForm, isPending } = useMutation<
    FormResult | null,
    Error,
    unknown
  >({
    mutationFn: async (data) => formsApi.submitForm(form, useDraft, data),
    onSuccess: (formResult) => {
      switch (formResult?.type) {
        case FormResultTypes.MARKDOWN:
          setMarkdownResponse(formResult.value as string);
          break;
        case FormResultTypes.FILE:
          handleDownloadFile(formResult);
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
  });

  return (
    <div className="w-full h-full flex">
      <div className="container py-20">
        <Form {...reactForm}>
          <form onSubmit={reactForm.handleSubmit((data) => submitForm(data))}>
            <Card className="w-[500px] mx-auto">
              <CardHeader>
                <CardTitle className="text-center">{form?.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid w-full items-center gap-6">
                  {form?.props.inputs.map((input) => {
                    return (
                      <FormField
                        key={input.displayName}
                        control={reactForm.control}
                        name={input.displayName}
                        render={({ field }) => (
                          <>
                            {input.type === FormInputType.TOGGLE && (
                              <FormItem className="flex items-center gap-2">
                                <Switch
                                  onCheckedChange={(e) => field.onChange(e)}
                                  checked={field.value as boolean}
                                />
                                <FormLabel
                                  htmlFor={input.displayName}
                                  className="flex items-center justify-center"
                                >
                                  {input.displayName}
                                </FormLabel>
                              </FormItem>
                            )}
                            {input.type !== FormInputType.TOGGLE && (
                              <FormItem className="flex flex-col gap-1">
                                <FormLabel
                                  htmlFor={input.displayName}
                                  className="flex items-center justify-between"
                                >
                                  {input.displayName}
                                </FormLabel>
                                <FormControl className="flex flex-col gap-1">
                                  <>
                                    {input.type === FormInputType.TEXT_AREA && (
                                      <Textarea
                                        onChange={field.onChange}
                                        value={
                                          field.value as string | undefined
                                        }
                                      />
                                    )}
                                    {input.type === FormInputType.TEXT && (
                                      <Input
                                        onChange={field.onChange}
                                        value={
                                          field.value as string | undefined
                                        }
                                      />
                                    )}
                                    {input.type === FormInputType.FILE && (
                                      <Input
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            fileToBase64(file, (result) => {
                                              field.onChange(result);
                                            });
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
            <ShowPoweredBy />
          </form>
        </Form>
      </div>
    </div>
  );
};

ApForm.displayName = 'ApForm';
export { ApForm };
