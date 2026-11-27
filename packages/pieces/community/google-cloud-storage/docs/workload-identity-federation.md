# Google Cloud Storage: Workload Identity Federation (OIDC) setup

Connect the Google Cloud Storage piece to your Google Cloud project **without storing a client secret or a service account key**.

Activepieces acts as an **OIDC identity provider**. Your Google Cloud project trusts it through **Workload Identity Federation**: at run time the piece gets a short-lived Activepieces token, exchanges it at the Google Security Token Service (STS) and, optionally, impersonates a service account. Nothing long-lived is saved in the connection.

## Values you need

The connection dialog (**Workload Identity Federation (OIDC)**) shows the two values that are specific to your Activepieces instance:

| Placeholder | What it is | Example |
|---|---|---|
| `<ISSUER_URL>` | Public URL of your Activepieces instance, used as the OIDC issuer | `https://automations.example.com` |
| `<SUBJECT>` | Identity of your Activepieces project: `platform:<PLATFORM_ID>:project:<PROJECT_ID>` | `platform:abc123:project:def456` |

From Google Cloud you need:

| Placeholder | Where to find it |
|---|---|
| `<GCP_PROJECT_ID>` | Project selector in the Google Cloud console |
| `<GCP_PROJECT_NUMBER>` | **IAM & Admin → Settings** (numeric, not the project ID) |

> Google fetches `<ISSUER_URL>/.well-known/openid-configuration` and `<ISSUER_URL>/.well-known/jwks.json`, so both must be **publicly reachable over HTTPS**. On self-hosted instances where the frontend and the API run on different domains, make sure `/.well-known/*` is routed to the API.

## 1. Enable the required APIs

```bash
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com storage.googleapis.com cloudresourcemanager.googleapis.com --project=<GCP_PROJECT_ID>
```

Add `pubsub.googleapis.com` if you use the **New Object Created** or **Object Updated** triggers.

## 2. Create the workload identity pool and the OIDC provider

```bash
gcloud iam workload-identity-pools create activepieces \
  --project=<GCP_PROJECT_ID> --location=global --display-name="Activepieces"

gcloud iam workload-identity-pools providers create-oidc activepieces \
  --project=<GCP_PROJECT_ID> \
  --location=global \
  --workload-identity-pool=activepieces \
  --issuer-uri="<ISSUER_URL>" \
  --attribute-mapping="google.subject=assertion.sub" \
  --attribute-condition="assertion.sub == '<SUBJECT>'"
```

- `--issuer-uri` must match `<ISSUER_URL>` **exactly** (HTTPS, no trailing slash).
- **Keep the attribute condition.** It restricts the provider to your Activepieces project; without it, any project on the same Activepieces instance could use your provider.
- No `--allowed-audiences` is needed: the piece uses the provider resource name as the audience, which Google accepts by default.

## 3. Grant access

### Option A (recommended): impersonate a service account

```bash
gcloud iam service-accounts create activepieces-gcs --project=<GCP_PROJECT_ID>

gcloud iam service-accounts add-iam-policy-binding \
  activepieces-gcs@<GCP_PROJECT_ID>.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/<GCP_PROJECT_NUMBER>/locations/global/workloadIdentityPools/activepieces/subject/<SUBJECT>"
```

Then grant the service account the roles it needs (see [Required roles](#required-roles)) and fill **Service Account Email** in the connection.

### Option B: grant roles directly to the federated principal

Grant the roles to `principal://iam.googleapis.com/projects/<GCP_PROJECT_NUMBER>/locations/global/workloadIdentityPools/activepieces/subject/<SUBJECT>` and leave **Service Account Email** empty.

## Required roles

| Feature | Role |
|---|---|
| Actions on buckets and objects (search, create, clone, delete, ACLs) | `roles/storage.admin`, or a narrower Storage role that covers the actions you use |
| **Project** dropdown (lists projects) | `roles/browser` |
| Triggers (create topics, notifications and push subscriptions) | `roles/pubsub.admin` |

Triggers also need the **Cloud Storage service agent** to publish to the topics the piece creates:

```bash
gcloud storage service-agent --project=<GCP_PROJECT_ID>

gcloud projects add-iam-policy-binding <GCP_PROJECT_ID> \
  --member="serviceAccount:service-<GCP_PROJECT_NUMBER>@gs-project-accounts.iam.gserviceaccount.com" \
  --role=roles/pubsub.publisher
```

The first command creates the service agent if it does not exist yet.

ACL actions only work on buckets **without uniform bucket-level access**.

## 4. Create the connection

In Activepieces, add a **Google Cloud Storage** connection, choose **Workload Identity Federation (OIDC)** and fill in:

| Field | Value |
|---|---|
| Project Number | `<GCP_PROJECT_NUMBER>` |
| Workload Identity Pool ID | `activepieces` |
| Workload Identity Provider ID | `activepieces` |
| Service Account Email | `activepieces-gcs@<GCP_PROJECT_ID>.iam.gserviceaccount.com` (Option A) or empty (Option B) |

Saving the connection performs a real token exchange, so a successful save confirms the federation setup.

## Troubleshooting

| Message | Cause | Fix |
|---|---|---|
| `Project Number must be the numeric project number…` | The project ID was used | Use the numeric project number |
| `Google STS rejected the OIDC token: … audience … is invalid` | Pool or provider does not exist, or wrong project number | Check the pool ID, provider ID and project number |
| `Google STS rejected the OIDC token: … attribute condition` / `invalid_grant` | Issuer or subject do not match | Compare `--issuer-uri` and the attribute condition with the values in the connection dialog |
| `Could not impersonate service account …: … API has not been used …` | IAM Service Account Credentials API disabled | Enable `iamcredentials.googleapis.com` (step 1) and wait a few minutes |
| `Could not impersonate service account …` (permission denied) | Missing `roles/iam.workloadIdentityUser` binding | Run the binding from Option A |
| Actions fail with 403 after the connection saved | The service account (or principal) lacks Storage roles | Grant the roles in [Required roles](#required-roles) |
| Trigger fails to enable with `pubsub.topics.create` denied | Missing Pub/Sub role | Grant `roles/pubsub.admin` |

IAM changes can take a few minutes to propagate.
