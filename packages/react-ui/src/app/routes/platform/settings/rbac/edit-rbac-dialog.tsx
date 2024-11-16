import { useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { rbacApi } from '@/features/platform-admin-panel/lib/rbac-api';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Input } from '@/components/ui/input';
import { Rbac } from '@activepieces/shared';
import { InitialPermissions } from './index';

interface EditRbacDialogProps {
    rbac: Rbac;
    onUpdate: () => void;
    children: ReactNode;
}

export const EditRbacDialog = ({ rbac, onUpdate, children }: EditRbacDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [roleName, setRoleName] = useState(rbac.name);
    const [permissions, setPermissions] = useState(rbac.permissions);

    const { mutate } = useMutation({
        mutationFn: async () => {
            await rbacApi.update(rbac.id, { name: roleName, permissions });
        },
        onSuccess: () => {
            setIsOpen(false);
            onUpdate();
        },
    });

    const handlePermissionChange = (permission: string, level: string) => {
        const currentPermission = InitialPermissions.find(p => p.name === permission);
        let updatedPermissions = new Set(permissions);

        if (level === 'None') {
            currentPermission?.read.forEach(p => updatedPermissions.delete(p));
            currentPermission?.write.forEach(p => updatedPermissions.delete(p));
        } else if (level === 'Read') {
            currentPermission?.write.forEach(p => updatedPermissions.delete(p));
            currentPermission?.read.forEach(p => updatedPermissions.add(p));
        } else if (level === 'Write') {
            currentPermission?.write.forEach(p => updatedPermissions.add(p));
        }
        console.log(updatedPermissions);

        setPermissions(Array.from(updatedPermissions));
    };

    const getButtonVariant = (permission: string, level: string) => {
        const currentPermission = InitialPermissions.find(p => p.name === permission);
        const writePermissions = new Set(currentPermission?.write || []);
        const readPermissions = new Set(currentPermission?.read || []);
        const currentPermissionsSet = new Set(permissions);

        const hasWritePermissions = [...writePermissions].every(p => currentPermissionsSet.has(p));
        const hasReadPermissions = [...readPermissions].every(p => currentPermissionsSet.has(p)) && !hasWritePermissions;

        if (level === 'Write' && hasWritePermissions) {
            return 'default';
        } else if (level === 'Read' && hasReadPermissions) {
            return 'default';
        } else if (level === 'None' && !hasReadPermissions && !hasWritePermissions) {
            return 'default';
        }
        return 'ghost';
    };

    const handleSave = () => {
        mutate();
    };

    return (
        <>
            <Button variant="ghost" className="size-8 p-0" onClick={() => setIsOpen(true)}>{children}</Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-full max-w-2xl">
                    <DialogTitle>{t('Edit Role')}</DialogTitle>
                    <div className="grid space-y-4 mt-4">
                        <div>
                            <span className="text-sm font-medium text-gray-700">{t('Name')}</span>
                            <Input
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                required
                                id="name"
                                type="text"
                                placeholder={t('Role Name')}
                                className="rounded-sm mt-2"
                            />
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700">{t('Permissions')}</span>
                            <div className="overflow-y-auto p-2 rounded-md">
                                {InitialPermissions.map((permission, index) => (
                                    <div
                                        key={permission.name}
                                        className={`w-full flex flex-col justify-between py-2 ${index !== InitialPermissions.length - 1 ? 'border-b' : ''}`}
                                    >
                                        <div className="w-full flex flex-row justify-between">
                                            <span className="font-bold text-gray-700">{permission.name}</span>
                                            <div className="flex bg-gray-100 rounded-sm space-x-2">
                                                <Button
                                                    className="h-9 px-4"
                                                    variant={getButtonVariant(permission.name, 'None')}
                                                    onClick={() => handlePermissionChange(permission.name, 'None')}
                                                >
                                                    None
                                                </Button>
                                                <Button
                                                    className="h-9 px-4"
                                                    variant={getButtonVariant(permission.name, 'Read')}
                                                    onClick={() => handlePermissionChange(permission.name, 'Read')}
                                                >
                                                    Read
                                                </Button>
                                                <Button
                                                    className="h-9 px-4"
                                                    variant={getButtonVariant(permission.name, 'Write')}
                                                    onClick={() => handlePermissionChange(permission.name, 'Write')}
                                                >
                                                    Write
                                                </Button>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">{permission.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleSave}>{t('Save')}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}; 