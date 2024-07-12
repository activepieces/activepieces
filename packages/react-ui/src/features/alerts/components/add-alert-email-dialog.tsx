import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import React from "react"
import { Static, Type } from "@sinclair/typebox"
import { typeboxResolver } from "@hookform/resolvers/typebox"
import { SubmitHandler, useForm } from "react-hook-form"
import { FormField, FormItem, Form, FormMessage } from "@/components/ui/form"

const FormSchema = Type.Object({
    email: Type.String({})
});

type FormSchema = Static<typeof FormSchema>

type AddAlertEmailDialogProps = {
    onSubmit: SubmitHandler<FormSchema>
}

const AddAlertEmailDialog = React.memo(({ onSubmit }: AddAlertEmailDialogProps) => {

    const form = useForm<FormSchema>({
        resolver: typeboxResolver(FormSchema),
        defaultValues: {},
    })

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 mt-4">
                    <Plus className="h-4 w-4" />
                    <span>Add email</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Alert Email</DialogTitle>
                    <DialogDescription>
                        Enter the email address to receive alerts.
                    </DialogDescription>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem className="grid gap-3">
                                    <Label htmlFor="email">Email</Label>
                                    <Input {...field} id="email" type="email" placeholder="gilfoyle@piedpiper.com" />
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="submit">Add Email</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogHeader>
            </DialogContent>

        </Dialog>
    )
})

export { AddAlertEmailDialog }