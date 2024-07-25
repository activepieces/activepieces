import { ResetPasswordRequestBody } from '@activepieces/ee-shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { HttpError, api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';

const FormSchema = Type.Object({
  otp: Type.String(),
  userId: Type.String(),
  newPassword: Type.String({
    errorMessage: 'Please enter your password',
  }),
});

type FormSchema = Static<typeof FormSchema>;

const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);

  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      otp: queryParams.get('otpcode') || '',
      userId: queryParams.get('userId') || '',
    },
  });

  const { mutate, isPending } = useMutation<
    void,
    HttpError,
    ResetPasswordRequestBody
  >({
    mutationFn: authenticationApi.resetPassword,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your password was changed!',
        duration: 3000,
      });
      navigate('/sign-in');
    },
    onError: (error) => {
      if (api.isError(error)) {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordRequestBody> = (data) => {
    mutate(data);
  };

  return (
    <Card className="w-[28rem] rounded-sm drop-shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="grid gap-2">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="w-full grid space-y-2">
                  <Label htmlFor="email">Password</Label>
                  <Input {...field} type="password" placeholder="********" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-full"
              loading={isPending}
              onClick={(e) => form.handleSubmit(onSubmit)(e)}
            >
              Confirm
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export { ChangePasswordForm };
