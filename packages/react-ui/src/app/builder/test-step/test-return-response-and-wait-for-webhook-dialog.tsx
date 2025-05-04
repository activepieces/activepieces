import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { t } from "i18next"
import { Action, apId } from "@activepieces/shared"
import { ControllerRenderProps, useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { SearchableSelect } from "@/components/custom/searchable-select"
import { DictionaryProperty } from "../piece-properties/dictionary-property"
import { JsonEditor } from "@/components/custom/json-editor"
import { Input } from "@/components/ui/input"
import { DialogClose } from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import testStepHooks from "./test-step-hooks"

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
const ResumeWebhookRequest = z.object({
    bodyType: z.nativeEnum(BodyType),
    body: z.union([z.object({}), z.string()]),
    headers: z.record(z.string(), z.string()),
    queryParams: z.record(z.string(), z.string()),
})
const TestReturnResponseAndWaitForWebhookDialog = ({currentStep, open, onOpenChange}: {currentStep: Action, open: boolean, onOpenChange: (open: boolean) => void}) => {
  
    const form = useForm<z.infer<typeof ResumeWebhookRequest>>({
        defaultValues: {
            bodyType: BodyType.JSON,
            body: {},
            headers: {},
            queryParams: {},
        }
    })
    const {mutate: onSubmit, isPending: isLoading} = testStepHooks.useTestAction({currentStep, setErrorMessage:undefined, setConsoleLogs:undefined, onSuccess:()=>{
        onOpenChange(false);
    }})
  
    return <>
     <Dialog open={open} onOpenChange={onOpenChange}>
       
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{t('Resume Webhook Request')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
             <form className="space-y-4" onSubmit={form.handleSubmit((data)=>{
                onSubmit({
                    id: apId(),
                    input: currentStep.settings,
                    success: true,
                    output: {
                        queryParams: data.queryParams,
                        headers: data.headers,
                        body: data.body,
                    },
                    standardError: '',
                    standardOutput: '',
                })
             })}>
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

TestReturnResponseAndWaitForWebhookDialog.displayName = 'TestReturnResponseAndWaitForWebhookDialog'




export default TestReturnResponseAndWaitForWebhookDialog