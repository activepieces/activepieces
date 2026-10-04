import { AdminControlId, adminControls } from '@/lib/admin-controls';

export function adminControl(id: AdminControlId): AdminControlAttributes {
  return { [adminControls.attribute]: id };
}

type AdminControlAttributes = {
  [adminControls.attribute]: AdminControlId;
};
