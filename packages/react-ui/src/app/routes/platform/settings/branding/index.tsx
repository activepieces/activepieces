import { AppearanceSection } from "@/app/routes/platform/settings/branding/appearance-section";
import { SmtpSection } from "@/app/routes/platform/settings/branding/smtp-section";

export const BrandingPage = () => {
  return <div className="flex flex-col gap-4">
    <AppearanceSection />
    <SmtpSection />
  </div>
}

