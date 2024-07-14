import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERNAL_ERROR_TOAST, toast } from "@/components/ui/use-toast";
import { HttpError, api } from "@/lib/api";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type, Static } from "@sinclair/typebox";
import { useForm } from "react-hook-form";
import { authenticationApi } from "../lib/authentication-api";
import { ResetPasswordRequestBody } from "@activepieces/ee-shared";
import { useMutation } from "@tanstack/react-query";

const FormSchema = Type.Object({
    email: Type.String({
        errorMessage: "Please enter your email",
    }),
});

type FormSchema = Static<typeof FormSchema>

const ResetPasswordForm = () => {

    const form = useForm<FormSchema>({
        resolver: typeboxResolver(FormSchema),
    })

    const mutation = useMutation<void, HttpError, ResetPasswordRequestBody>({
        mutationFn: async (request) => {
            await authenticationApi.resetPassword(request);
            return;
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: 'Your changes have been saved.',
                duration: 3000,
            })
        },
        onError: (error) => {
            if (api.isError(error)) {
                console.log(error);
                toast(INTERNAL_ERROR_TOAST)
            }
        },
    });
    return (
        <Card className="mx-auto max-w-sm mt-[200px]">
            <CardHeader>
                <CardTitle className="text-2xl">Forget Password?</CardTitle>
                <CardDescription>
                    If the email you entered exists, you will receive an email with a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="grid gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input {...field}  type="text" placeholder="gilfoyle@piedpiper.com" />
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button  className="w-full">
                            Send Password Reset Link
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

ResetPasswordForm.displayName = "ResetPassword"

export { ResetPasswordForm }