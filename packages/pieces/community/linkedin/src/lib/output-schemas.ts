import { OutputSchema } from '@activepieces/pieces-framework';

const postCreationFields: OutputSchema['fields'] = [
  {
    key: 'success',
    label: 'Success',
    format: 'boolean',
  },
  {
    key: 'post_urn',
    label: 'Post URN',
    description:
      'URN of the created post, used by Update Post Commentary and Delete Post.',
  },
];

export const createShareUpdateActionOutputSchema: OutputSchema = {
  fields: postCreationFields,
};

export const createCompanyUpdateActionOutputSchema: OutputSchema = {
  fields: postCreationFields,
};

export const createMemberPostActionOutputSchema: OutputSchema = {
  fields: postCreationFields,
};

export const getCurrentMemberProfileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sub',
      label: 'Member ID',
    },
    {
      key: 'member_urn',
      label: 'Member URN',
      description:
        'Author URN accepted by Create Member Post and Create Image Upload URL.',
    },
    {
      key: 'name',
      label: 'Full Name',
    },
    {
      key: 'given_name',
      label: 'First Name',
    },
    {
      key: 'family_name',
      label: 'Last Name',
    },
    {
      key: 'email',
      label: 'Email',
      format: 'email',
    },
    {
      key: 'email_verified',
      label: 'Email Verified',
      format: 'boolean',
    },
    {
      key: 'picture',
      label: 'Profile Picture',
      format: 'image',
    },
    {
      key: 'locale',
      label: 'Locale',
    },
  ],
};

export const listManagedOrganizationsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        {
          key: 'organization_urn',
          label: 'Organization URN',
        },
        {
          key: 'organization_id',
          label: 'Organization ID',
        },
        {
          key: 'name',
          label: 'Name',
        },
        {
          key: 'vanity_name',
          label: 'Vanity Name',
        },
        {
          key: 'website',
          label: 'Website',
          format: 'url',
        },
        {
          key: 'role',
          label: 'Role',
        },
        {
          key: 'state',
          label: 'State',
        },
      ],
    },
    {
      key: 'count',
      label: 'Count',
      format: 'number',
    },
  ],
};

export const updatePostCommentaryActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      format: 'boolean',
    },
    {
      key: 'post_urn',
      label: 'Post URN',
    },
    {
      key: 'updated_fields',
      label: 'Updated Fields',
      description: 'Comma-separated names of the fields that were changed.',
    },
    {
      key: 'updated_field_count',
      label: 'Updated Field Count',
      format: 'number',
    },
  ],
};

export const createImageUploadUrlActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'owner_urn',
      label: 'Owner URN',
    },
    {
      key: 'image_urn',
      label: 'Image URN',
      description:
        'Pass this as the Image URN of Create Member Post once the bytes are uploaded.',
    },
    {
      key: 'upload_url',
      label: 'Upload URL',
      format: 'url',
      description: 'PUT the raw image bytes here before posting.',
    },
    {
      key: 'upload_url_expires_at',
      label: 'Upload URL Expires At',
      format: 'datetime',
    },
  ],
};

export const deletePostActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'deleted',
      label: 'Deleted',
      format: 'boolean',
    },
    {
      key: 'post_urn',
      label: 'Post URN',
    },
    {
      key: 'already_deleted',
      label: 'Already Deleted',
      format: 'boolean',
      description:
        'True when the post was already gone, so this call changed nothing.',
    },
  ],
};
