import { UpdateMeResponse, UserWithBadges } from '@activepieces/shared';

import { api } from './api';

export const userApi = {
  getUserById(id: string) {
    return api.get<UserWithBadges>(`/v1/users/${id}`);
  },
  updateMe(profilePicture?: File): Promise<UpdateMeResponse> {
    const formData = new FormData();
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    return api.any<UpdateMeResponse>('/v1/users/me', {
      method: 'POST',
      data: formData,
    });
  },
  deleteProfilePicture(): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>('/v1/users/me/profile-picture');
  },
};
