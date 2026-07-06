import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';

export const brandingMutations = {
  useUpdateAppearance: ({ platformId }: { platformId: string }) => {
    return useMutation({
      mutationFn: async (formData: FormData) => {
        await platformApi.updateWithFormData(formData, platformId);
        window.location.reload();
      },
      onSuccess: () => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
    });
  },
};
