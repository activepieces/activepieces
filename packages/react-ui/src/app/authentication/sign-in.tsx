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
import { Link } from "react-router-dom"
import { useState } from "react"
import { useMutation } from '@tanstack/react-query'

type FormData = {
  email: string;
  password: string;
};

async function signIn(data: FormData) {
  const response = await fetch('/api/sign-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}

export function SignInForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  
  const mutation = useMutation(signIn, {
    onSuccess: data => {
      console.log('Success:', data)
    },
    onError: error => {
      console.error('Error:', error)
    },
  })
  
  const onSubmit: SubmitHandler<FormData> = data => {
    mutation.mutate(data)
  }

  return (
    <Card className="ap-mx-auto ap-max-w-sm ap-mt-[200px]">
      <CardHeader>
        <CardTitle className="ap-text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your email below to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="ap-grid ap-gap-4">
          <div className="ap-grid ap-gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <span className="ap-text-red-500">{errors.email.message}</span>}
          </div>
          <div className="ap-grid ap-gap-2">
            <div className="ap-flex ap-items-center">
              <Label htmlFor="password">Password</Label>
              <Link to='/forget-password' className="ap-ml-auto ap-inline-block ap-text-sm ap-underline">
                Forgot your password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <span className="ap-text-red-500">{errors.password.message}</span>}
          </div>
          <Button type="submit" className="ap-w-full" loading={mutation.isLoading}>
            Sign in
          </Button>
          <Button variant="outline" className="ap-w-full">
            Sign in with Google
          </Button>
        </form>
        <div className="ap-mt-4 ap-text-center ap-text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="ap-underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}