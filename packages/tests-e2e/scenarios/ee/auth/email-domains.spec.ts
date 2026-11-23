import { randomUUID } from 'node:crypto';
import { expect, test } from '../../../fixtures';
import { EmailDomainsPage } from '../../../pages/email-domains.page';

test.describe('Email domains', { tag: ['@feature:email-domains', '@platform-state'] }, () => {
  test('admin adds a second domain', async ({ page, cleanup }) => {
    const emailDomainsPage = new EmailDomainsPage(page);
    const first = `e2e-${randomUUID().slice(0, 8)}.example.com`;
    const second = `e2e-${randomUUID().slice(0, 8)}.example.com`;

    await emailDomainsPage.visit();
    const firstAdded = await emailDomainsPage.addDomain({ domain: first });
    cleanup.track({ resource: 'email-domains', id: firstAdded.id });
    await emailDomainsPage.expectTxtValue({ value: firstAdded.verificationRecordValue });
    const verification = await emailDomainsPage.verify({ id: firstAdded.id });
    expect(verification.verificationStatus).toBe('PENDING_VERIFICATION');
    await emailDomainsPage.closeDialog();

    const secondAdded = await emailDomainsPage.addDomain({ domain: second });
    cleanup.track({ resource: 'email-domains', id: secondAdded.id });
    await emailDomainsPage.expectTxtValue({ value: secondAdded.verificationRecordValue });
    expect(secondAdded.verificationRecordValue).not.toBe(firstAdded.verificationRecordValue);
    await emailDomainsPage.closeDialog();

    await page.reload();
    await emailDomainsPage.expectPendingRow({ domain: first });
    await emailDomainsPage.expectPendingRow({ domain: second });

    await emailDomainsPage.cancelVerification({ domain: second, id: secondAdded.id });
    await emailDomainsPage.cancelVerification({ domain: first, id: firstAdded.id });
    await page.reload();
    await emailDomainsPage.expectNoRow({ domain: first });
    await emailDomainsPage.expectNoRow({ domain: second });
  });
});
