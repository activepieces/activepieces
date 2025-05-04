import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { t } from "i18next"
import { Action, ApFlagId, apId, Trigger } from "@activepieces/shared"
import { ControllerRenderProps, useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { SearchableSelect } from "@/components/custom/searchable-select"
import { DictionaryProperty } from "../../piece-properties/dictionary-property"
import { JsonEditor } from "@/components/custom/json-editor"
import { Input } from "@/components/ui/input"
import { DialogClose } from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import testStepHooks from "../test-step-hooks"
import { HttpMethod } from "@activepieces/pieces-common"
import { flagsHooks } from "@/hooks/flags-hooks"
import { useBuilderStateContext } from "../../builder-hooks"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

enum BodyType {
    JSON = 'json',
    TEXT = 'text',
    FORM_DATA = 'form-data',
}


const BodyFormInput  = ({bodyType, field}:{bodyType:BodyType, field:ControllerRenderProps<any> })=>{
    switch(bodyType){
        case BodyType.JSON:
            return <JsonEditor
                field={field}
                readonly={false}
            >

            </JsonEditor>
        case BodyType.TEXT: 
        return <Input 
        {...field}
        />
        case BodyType.FORM_DATA:
            return <DictionaryProperty
                values={field.value}
                onChange={field.onChange}
                disabled={false}
                useMentionTextInput={false}
            ></DictionaryProperty>
    }

}
const WebhookRequest = z.object({
    bodyType: z.nativeEnum(BodyType),
    body: z.union([z.object({}), z.string()]),
    headers: z.record(z.string(), z.string()),
    queryParams: z.record(z.string(), z.string()),
    method: z.nativeEnum(HttpMethod),
})

type TestWaitForNextWebhookDialogProps = {
    currentStep: Action
    open: boolean
    onOpenChange: (open: boolean) => void
    testingMode: 'returnResponseAndWaitForNextWebhook'
}

type TestTriggerWebhookDialogProps = {
    currentStep: Trigger,
    open: boolean
    onOpenChange: (open: boolean) => void
    testingMode: 'trigger'
    url: string
}
type TestWebhookDialogProps = TestWaitForNextWebhookDialogProps | TestTriggerWebhookDialogProps
 
const TestTriggerWebhookDialog = ({open, onOpenChange, testingMode, url}: TestTriggerWebhookDialogProps ) => {

    const {mutate: onSubmit, isPending} = useMutation<unknown, Error, z.infer<typeof WebhookRequest>>({
        mutationFn: async(data: z.infer<typeof WebhookRequest>) => {
              await  api.any(url, {
                method: data.method,
                data: data.body,
                headers: data.headers,
                params: data.queryParams,
             })
             return new Promise((resolve)=>{
                setTimeout(()=>{
                    resolve(null)
                }, 2000)
             })
        },
        onSuccess: () => {
            onOpenChange(false)
        }
    })

    return <TestWebhookFunctionalityDialog
        testingMode={testingMode}
        onSubmit={onSubmit}
        open={open}
        onOpenChange={onOpenChange}
        isLoading={isPending}
        url={url}
    />
}


const TestWaitForNextWebhookDialog = ({currentStep, open, onOpenChange, testingMode}: TestWaitForNextWebhookDialogProps ) => {
    const {mutate: onSubmit, isPending: isLoading} = testStepHooks.useTestAction({currentStep, setErrorMessage:undefined, setConsoleLogs:undefined, onSuccess:()=>{
        onOpenChange(false);
    }})
    return <TestWebhookFunctionalityDialog
        testingMode={testingMode}
        onSubmit={(data)=>{
            onSubmit({
                id: apId(),
                success: true,
                output: {
                    body: data.body,
                    headers: data.headers,
                    queryParams: data.queryParams,
                },
                standardError: '',
                standardOutput: '',
                input: {},
            })
        }}
        open={open}
        onOpenChange={onOpenChange}
        isLoading={isLoading}
    />
   
}

type TestingWebhookFunctionalityDialogProps = {
    onSubmit: (data: z.infer<typeof WebhookRequest>) => void
    open: boolean
    onOpenChange: (open: boolean) => void
    isLoading: boolean
} & ({
    testingMode: 'returnResponseAndWaitForNextWebhook'
} | {
    testingMode: 'trigger'
    url: string
})

const TestWebhookFunctionalityDialog = ( req: 
    TestingWebhookFunctionalityDialogProps)=>{
    const { testingMode, onSubmit, open, onOpenChange, isLoading } = req
    const form = useForm<z.infer<typeof WebhookRequest>>({
        defaultValues: {
            bodyType: BodyType.JSON,
            body: {},
            headers: {},
            queryParams: {},
            method: HttpMethod.GET,
        }
    })

    
    return <>
     <Dialog open={open} onOpenChange={onOpenChange}>
       
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{testingMode === 'returnResponseAndWaitForNextWebhook' ? t('Resume Webhook Request') : t('Trigger Webhook')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
             <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                {
                    testingMode === 'trigger' && (<>
                      <FormItem>
                        <FormLabel>{t('Webhook URL')}</FormLabel>
                        <Input
                           readOnly={true}
                           value={req.url}
                        />
                      </FormItem>
                      <FormField
                        control={form.control}
                        name="method"
                        render={({field})=>{
                            return <FormItem>
                                <FormLabel>{t('Method')}</FormLabel>
                                <SearchableSelect
                                    options={Object.values(HttpMethod).map(method=>({
                                        value: method,
                                        label: method,
                                    }))}
                                    onChange={(val)=>{
                                        field.onChange(val);
                                    }}
                                    value={field.value}
                                    disabled={false}
                                    placeholder={t('Select an option')}
                                />
                            </FormItem>
                        }}
                      />
                    </>)
                }

                <FormField
                    control={form.control}
                    name="queryParams"
                    render={({field})=>{
                        return <FormItem>
                            <FormLabel>{t('Query Params')}</FormLabel>
                            <DictionaryProperty
                                values={field.value}
                                onChange={field.onChange}
                                disabled={false}
                                useMentionTextInput={false}
                                skipEmptyKeys={true}
                            ></DictionaryProperty>
                        </FormItem>
                    }}>
                        
                    </FormField>

                    <FormField
                    control={form.control}
                    name="headers"
                    render={({field})=>{
                        return <FormItem>
                            <FormLabel>{t('Headers')}</FormLabel>
                            <DictionaryProperty
                                values={field.value}
                                onChange={field.onChange}
                                disabled={false}
                                useMentionTextInput={false}
                                skipEmptyKeys={true}
                            ></DictionaryProperty>
                        </FormItem>
                    }}>
                        
                    </FormField>

               
                            <FormField
                            name="bodyType"
                            render={({field})=>{
                                return  <FormItem>
                                    <FormLabel>{t('Body Type')}</FormLabel>
                                    <SearchableSelect
                                    options={[
                                        {
                                            value: BodyType.JSON,
                                            label: t('JSON'),
                                        },
                                        {
                                            value: BodyType.TEXT,
                                            label: t('Text'),
                                        },
                                        {
                                            value: BodyType.FORM_DATA,
                                            label: t('Form Data'),
                                        },
                                    ]}
                                    onChange={(val)=>{
                                        field.onChange(val);
                                        switch(val){
                                            case BodyType.JSON:
                                            case BodyType.FORM_DATA:
                                                form.setValue('body', {});
                                                break;
                                            case BodyType.TEXT:
                                                form.setValue('body', '');
                                                break;
                                        }
                                    }}
                                    value={field.value}
                                    disabled={false}
                                    placeholder={t('Select an option')}
                                    showDeselect={true}
                                ></SearchableSelect>
                                </FormItem>
                            }}>

                            </FormField>
                        <FormField
                            control={form.control}
                            name="body"
                            render={({field})=>{
                                return <FormItem>
                                    <FormLabel>{t('Body')}</FormLabel>
                                    <BodyFormInput
                                    bodyType={form.getValues('bodyType')}
                                    field={field}
                                    ></BodyFormInput>
                                </FormItem>
                            }}
                        >
                        </FormField>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">{t('Cancel')}</Button>
                        </DialogClose>
                        <Button type="submit" loading={isLoading}>{t('Save')}</Button>
                    </DialogFooter>

             </form>

            </Form>
        </DialogContent>
     </Dialog>
    </>
}


TestWebhookFunctionalityDialog.displayName = 'TestWebhookFunctionalityDialog'

const TestWebhookDialog = ({testingMode, currentStep, open, onOpenChange}: TestWebhookDialogProps)=>{
    const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
        ApFlagId.WEBHOOK_URL_PREFIX,
      );
    const flowId = useBuilderStateContext(state=>state.flow.id)
    const url = `${webhookPrefixUrl}/${flowId}`
    
    if(testingMode === 'returnResponseAndWaitForNextWebhook'){
        return <TestWaitForNextWebhookDialog
            currentStep={currentStep}
            open={open}
            onOpenChange={onOpenChange}
            testingMode={testingMode}
        />
    }
    if(testingMode === 'trigger'){
        return <TestTriggerWebhookDialog
            currentStep={currentStep}
            open={open}
            onOpenChange={onOpenChange}
            testingMode={testingMode}
            url={url}
        />
    }
}

TestWebhookDialog.displayName = 'TestWebhookDialog'
export default TestWebhookDialog