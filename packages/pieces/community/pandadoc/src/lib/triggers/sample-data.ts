export const pandadocSampleEvent = {
  "event": "document_state_changed",
  "id": "75LGDfaNYjJtT3SvaeZ9Li",
  "name": "Sales agreement",
  "status": "document.completed",
  "date_created": "2026-10-20T20:01:41.809699Z",
  "date_modified": "2026-10-20T20:06:46.215915Z",
  "date_sent": null,
  "date_completed": null,
  "expiration_date": "2026-12-19T20:06:21.221924Z",
  "version": "2",
  "ref_number": null,
  "folder_uuid": null,
  "template_id": null,
  "template_name": null,
  "created_by_email": "jane@example.com",
  "sent_by_email": "jane@example.com",
  "grand_total_amount": "0.00",
  "grand_total_currency": "JOD",
  "tags": [
    "sales"
  ],
  "metadata": {
    "source": "crm",
    "document__created_via_public_api": "true",
    "document__creation_source": "public api"
  },
  "tokens": [],
  "fields": [
    {
      "uuid": "04c0e5f5-c734-4904-a828-6a11ef76c999",
      "name": "like",
      "merge_field": "like",
      "field_id": "checkbox04c0e5f5-c734-4904-a828-6a11ef76c999",
      "type": "checkbox",
      "value": true,
      "is_filled": null,
      "assigned_to_email": "jane@example.com",
      "assigned_to_role": null
    },
    {
      "uuid": "28430672-2f72-4a9c-9565-e10efc0dae0f",
      "name": "Text",
      "merge_field": null,
      "field_id": "text28430672-2f72-4a9c-9565-e10efc0dae0f",
      "type": "text",
      "value": "",
      "is_filled": null,
      "assigned_to_email": "jane@example.com",
      "assigned_to_role": null
    },
    {
      "uuid": "7f459202-1aba-4105-8b8f-da3e3a855824",
      "name": "name",
      "merge_field": "name",
      "field_id": "text7f459202-1aba-4105-8b8f-da3e3a855824",
      "type": "text",
      "value": "AP Test",
      "is_filled": null,
      "assigned_to_email": "jane@example.com",
      "assigned_to_role": null
    },
    {
      "uuid": "e824141d-be7a-4728-8ae9-fb0e97e075cf",
      "name": "Date",
      "merge_field": null,
      "field_id": "datee824141d-be7a-4728-8ae9-fb0e97e075cf",
      "type": "date",
      "value": null,
      "is_filled": null,
      "assigned_to_email": "jane@example.com",
      "assigned_to_role": null
    },
    {
      "uuid": "e833ce51-8380-4f0c-9c93-e709b949afd7",
      "name": "Initials",
      "merge_field": null,
      "field_id": "initialse833ce51-8380-4f0c-9c93-e709b949afd7",
      "type": "initials",
      "value": {},
      "is_filled": null,
      "assigned_to_email": "jane@example.com",
      "assigned_to_role": null
    },
    {
      "uuid": "eeb86fe0-2414-4f6c-8405-5ded05d47b17",
      "name": "Signature",
      "merge_field": null,
      "field_id": "signatureeeb86fe0-2414-4f6c-8405-5ded05d47b17",
      "type": "signature",
      "value": {},
      "is_filled": null,
      "assigned_to_email": "jane@example.com",
      "assigned_to_role": null
    }
  ],
  "recipients": [
    {
      "id": "PoPafStm8fNFL9DdhjATLb",
      "email": "jane@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "phone": "",
      "role": "",
      "recipient_type": "signer",
      "has_completed": false,
      "signing_order": null,
      "contact_id": "s3ozKL7VJRL3hGdxXcqoJG",
      "shared_link": "https://app.pandadoc.com/document/v2?token=0123456789abcdef0123456789abcdef01234567"
    }
  ],
  "action_by_email": null,
  "action_by_first_name": null,
  "action_by_last_name": null,
  "action_date": null,
  "error_type": null,
  "error_detail": null
};

export const pandadocCreationFailedSample = {
  "event": "document_creation_failed",
  "id": "Hb64Mn5FytFXm5vW9VXvPj",
  "error_type": "validation_error",
  "error_detail": "All field tags within PDF must be declared within 'fields' object of the JSON Payload. No field with optId='like' found in 'fields' object, fields passed were ['name']"
};
