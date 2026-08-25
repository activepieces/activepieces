# Security

At Activepieces.com, we consider the security of our systems a top priority. But no matter how much effort we put into system security, there can still be vulnerabilities present.

If you discover a vulnerability, we would like to know about it so we can take steps to address it as quickly as possible. We would like to ask you to help us better protect our clients and our systems.

## Out of scope vulnerabilities:

- Clickjacking on pages with no sensitive actions.
- Unauthenticated/logout/login CSRF.
- Attacks requiring MITM or physical access to a user's device.
- Any activity that could lead to the disruption of our service (DoS).
- Content spoofing and text injection issues without showing an attack vector/without being able to modify HTML/CSS.
- Email spoofing
- Missing DNSSEC, CAA, CSP headers
- Lack of Secure or HTTP only flag on non-sensitive cookies
- Deadlinks
- `UNSANDBOXED` execution mode intended for trusted-operator deployments and blocked in EE/Cloud production.
- Input fields that accept special characters without a demonstrated exploitable sink.
- Capability-token endpoints (resume URLs, webhook URLs, signed file URLs): the token is the authorization. Reports must demonstrate a disclosure path (logging, `Referer` leakage, weak entropy) to be in scope.
- Findings whose only attack path is guessing a high-entropy identifier (e.g. nanoid) with no demonstrated disclosure source.

## Please do the following:

- Report your findings privately through the **Security** tab of our GitHub repository using [Report a vulnerability](https://github.com/activepieces/activepieces/security/advisories/new).
- Do not run automated scanners on our infrastructure or dashboard. If you wish to do this, contact us at security@activepieces.com and we will set up a sandbox for you.
- Do not take advantage of the vulnerability or problem you have discovered, for example by downloading more data than necessary to demonstrate the vulnerability or deleting or modifying other people's data,
- Use your own test account and test data when investigating an issue; do not target or access other users' accounts or data,
- If you encounter personal data belonging to others, stop immediately, do not store or share it, and tell us in your report,
- Do not reveal the problem to others until it has been resolved,
- Do not use attacks on physical security, social engineering, distributed denial of service, spam or applications of third parties,
- Do provide sufficient information to reproduce the problem, so we will be able to resolve it as quickly as possible. Usually, the IP address or the URL of the affected system and a description of the vulnerability will be sufficient, but complex vulnerabilities may require further explanation.

## What we promise:

- We will respond to your report within 7 business days with our evaluation of the report and an expected resolution date,
- If you have followed the instructions above, we will not take any legal action against you in regard to the report,
- We will handle your report with strict confidentiality, and not pass on your personal details to third parties without your permission,
- We will keep you informed of the progress towards resolving the problem,
- In the public information concerning the problem reported, we will give your name as the discoverer of the problem (unless you desire otherwise), and
- We strive to resolve all problems as quickly as possible, and we would like to play an active role in the ultimate publication on the problem after it is resolved.

## Disclosure Policy

We follow coordinated disclosure. Every report follows the [Security Advisory Response playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/security-advisory-response).

> **Note:** Our bug bounty program is currently private and invitation-only. We welcome vulnerability reports from anyone through GitHub's private vulnerability reporting, but reward eligibility is limited to invited researchers at this time.

We only publish advisories for vulnerabilities that affect users and warrant notifying them. Whether or not your report results in a published advisory has no bearing on reward eligibility. Reward ranges, eligibility, and terms are described in our [Vulnerability Disclosure Program](https://trust.activepieces.com).
