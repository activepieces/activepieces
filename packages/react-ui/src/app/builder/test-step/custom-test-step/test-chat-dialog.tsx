import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { apId } from '@activepieces/shared';

import { testStepHooks } from '../test-step-hooks';

type TestChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestingSuccess: () => void;
  onClose: () => void;
};

const ChatFormSchema = Type.Object({
  message: Type.String({
    minLength: 1,
    errorMessage: {
      minLength: t('Message is required'),
    },
  }),
});

type ChatFormData = Static<typeof ChatFormSchema>;

const TestChatDialog = ({
  open,
  onOpenChange,
  onTestingSuccess,
  onClose,
}: TestChatDialogProps) => {
  const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
    testStepHooks.useSaveMockData({
      onSuccess: () => {
        onTestingSuccess();
        onOpenChange(false);
      },
    });

  const chatForm = useForm<ChatFormData>({
    shouldFocusError: true,
    resolver: typeboxResolver(ChatFormSchema),
    defaultValues: {
      message: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: ChatFormData) => {
    const cleanedData = {
      message: data.message.trim(),
      sessionId: apId(),
    };
    saveMockAsSampleData(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="w-full max-w-xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="px-0.5">{t('Chat Message Test')}</DialogTitle>
          <DialogDescription className="px-0.5">
            {t('Enter a test message to use as sample data for the trigger.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...chatForm}>
          <form
            className="grid space-y-4"
            onSubmit={chatForm.handleSubmit(onSubmit)}
          >
            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-4">
                <div className="grid space-y-2 px-0.5">
                  <Label htmlFor="message">{t('Message')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('Enter your test message here...')}
                    className="min-h-[100px] resize-none"
                    {...chatForm.register('message')}
                  />
                  {chatForm.formState.errors.message && (
                    <p className="text-xs text-destructive font-medium">
                      {chatForm.formState.errors.message.message?.toString()}
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onOpenChange(false);
                }}
                disabled={isSavingMockdata}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={isSavingMockdata}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { TestChatDialog };
