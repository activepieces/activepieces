import { useForm, SubmitHandler } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormField, FormItem, Form, FormMessage } from "@/components/ui/form"
import { Link, useNavigate } from "react-router-dom"
import { SignInRequest, AuthenticationResponse } from '@activepieces/shared'
import { useMutation } from '@tanstack/react-query'
import React from "react"
import { HttpStatusCode } from "axios"
import { authenticationSession } from "../../../features/authentication/lib/authentication-session"
import { authenticationApi } from "../../../features/authentication/lib/authentication-api"
import { HttpError, api } from "@/lib/api"
import { Static, Type } from "@sinclair/typebox"
import { typeboxResolver } from "@hookform/resolvers/typebox"

const SignInFormsSchema = Type.Object({
    email: Type.String({
        errorMessages: "Email is required",
    }),
    password: Type.String({
        errorMessages: "Password is required",
    }),
})

type SignInFormsSchema = Static<typeof SignInFormsSchema>

const SignInForm: React.FC = React.memo(() => {
    const form = useForm<SignInFormsSchema>({
        resolver: typeboxResolver(SignInFormsSchema),
    })

    const navigate = useNavigate();

    const mutation = useMutation<AuthenticationResponse, HttpError, SignInRequest>({
        mutationFn: authenticationApi.signIn,
        onSuccess: (data) => {
            authenticationSession.saveResponse(data);
            navigate('/flows');
        },
        onError: (error) => {
            if (api.isError(error)) {
                switch (error.response?.status) {
                    case HttpStatusCode.Unauthorized: {
                        form.setError("root.serverError", {
                            message: "Invalid email or password",
                        })
                        break;
                    }
                    default: {
                        form.setError("root.serverError", {
                            message: "Something went wrong, please try again later",
                        })
                        break;
                    }
                }
                return;
            }
        },
    });


    const onSubmit: SubmitHandler<SignInRequest> = data => {
        form.setError("root.serverError", {
            message: undefined,
        });
        mutation.mutate(data);
    }

    return (
        <>
            <Card className="mx-auto max-w-sm mt-[200px]">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign In</CardTitle>
                    <CardDescription>
                        Enter your email below to sign in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem className="grid gap-3">
                                    <Label htmlFor="email">Email</Label>
                                    <Input {...field} id="email" type="text" placeholder="gilfoyle@piedpiper.com" />
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem className="grid gap-3">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        <Link to='/forget-password' className="ml-auto inline-block text-sm underline">
                                            Forgot your password?
                                        </Link>
                                    </div>
                                    <Input {...field} id="password" type="password" placeholder="********" />
                                    <FormMessage />
                                </FormItem>
                            )} />
                            {form?.formState?.errors?.root?.serverError && <FormMessage>{form.formState.errors.root.serverError.message}</FormMessage>}

                            <Button type="submit" className="w-full" loading={mutation.isPending}>
                                Sign in
                            </Button>
                            <Button variant="outline" className="w-full">
                                Sign in with Google
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link to="/signup" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </>

    )
})

SignInForm.displayName = "SignInForm"

export { SignInForm }