import { UserWithBadges } from '@activepieces/shared';

import { api, API_URL } from './api';
import { authenticationSession } from './authentication-session';

export const userApi = {
  getUserById(id: string) {
    return api.get<UserWithBadges>(`/v1/users/${id}`);
  },
  async uploadProfilePicture(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/v1/users/me/profile-picture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authenticationSession.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload profile picture');
    }

    return response.json();
  },
  async deleteProfilePicture(): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>('/v1/users/me/profile-picture');
  },
};
