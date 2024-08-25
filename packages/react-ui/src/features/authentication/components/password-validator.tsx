import { passwordRules } from '@/features/authentication/lib/password-validation-utils';
import { t } from 'i18next';
import { Check, X } from 'lucide-react';

const PasswordValidator = ({ password }: { password: string }) => {
  return (
    <>
      {passwordRules.map((rule, index) => {
        return (
          <div key={index} className="flex flex-row gap-2">
            {rule.condition(password) ? (
              <Check className="text-success" />
            ) : (
              <X className="text-destructive" />
            )}
            <span>{rule.label}</span>
          </div>
        );
      })}
    </>
  );
};
PasswordValidator.displayName = 'PasswordValidator';
export { PasswordValidator };
