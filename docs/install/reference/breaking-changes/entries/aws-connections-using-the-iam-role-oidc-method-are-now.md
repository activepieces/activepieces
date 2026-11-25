---
id: aws-connections-using-the-iam-role-oidc-method-are-now
title: "AWS connections using the IAM Role / OIDC method are now verified against AWS before they save"
added: '2026-09-03'
release: 0.90.1
---

Saving an AWS connection (Bedrock, S3, Secrets Manager) with the **IAM Role / OIDC** method previously only checked that the Role ARN was well formed, so any well-formed ARN saved with status "Connected" even when the role did not exist or could not be assumed. The connection now performs the same `sts:AssumeRoleWithWebIdentity` call the flow makes at runtime, and the save fails with the AWS error when the role cannot be assumed.

Two consequences. A connection that was accepted before is now rejected if its IAM OIDC provider, trust policy, or `AP_FRONTEND_URL` issuer is not set up correctly. And because the save now calls AWS, an instance with no outbound access to `sts.<region>.amazonaws.com` cannot create these connections at all.

The region on these connections is also validated against the AWS region format at both save time and every flow step (the region flows into the STS endpoint hostname, so the check is enforced everywhere it is used). The STS call now times out after 10 seconds instead of waiting for the job timeout.

#### What you need to do

Only if you use the IAM Role / OIDC method on an AWS piece. Allow outbound HTTPS to `sts.<region>.amazonaws.com` from the machine running the worker, and make sure `AP_FRONTEND_URL` matches the Provider URL of your IAM OIDC identity provider, since the issuer in the signed token is derived from it. Existing saved connections keep working and are not revalidated automatically — pressing **Recheck** on a connection whose trust policy is wrong will now move it to an error state, which reflects what already happens when a flow runs.
