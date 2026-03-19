type sFtpError = {
    error: string;
    description?: string;
}

type sFtpErrorWithCode = {
    [code: number]: sFtpError;
}

const sftpErrors: sFtpErrorWithCode = {
    0: {
        error: 'OK',
        description: 'Indicates successful completion of the operation.',
    },
    1: {
        error: 'EOF',
        description: 'An attempt to read past the end-of-file was made; or, there are no more directory entries to return.',
    },
    2: {
        error: 'No such file',
        description: 'A reference was made to a file which does not exist.',
    },
    3: {
        error: 'Permission denied',
        description: 'The user does not have sufficient permissions to perform the operation.',
    },
    4: {
        error: 'Failure',
        description: 'An error occurred, but no specific error code exists to describe the failure. This error message should always have meaningful text in the error message field.',
    },
    5: {
        error: 'Bad message',
        description: 'A badly formatted packet or other SFTP protocol incompatibility was detected.',
    },
    6: {
        error: 'No connection',
        description: 'There is no connection to the server. This error may be used locally, but must not be returned by a server.',
    },
    7: {
        error: 'Connection lost',
        description: 'The connection to the server was lost. This error may be used locally, but must not be returned by a server.',
    },
    8: {
        error: 'Operation unsupported',
        description: 'An attempted operation could not be completed by the server because the server does not support the operation.',
    },
    9: {
        error: 'Invalid handle',
        description: 'The handle value was invalid.',
    },
    10: {
        error: 'No such path',
        description: 'The file path does not exist or is invalid.',
    },
    11: {
        error: 'File already exists',
        description: 'The file already exists.',
    },
    12: {
        error: 'Write protect',
        description: 'The file is on read-only media, or the media is write protected.',
    },
    13: {
        error: 'No media',
        description: 'The requested operation cannot be completed because there is no media available in the drive.',
    },
    14: {
        error: 'No space on file-system',
        description: 'The requested operation cannot be completed because there is insufficient free space on the filesystem.',
    },
    15: {
        error: 'Quota exceeded',
        description: "The operation cannot be completed because it would exceed the user’s storage quota.",
    },
    16: {
        error: 'Unknown principal',
        description: 'A principal referenced by the request (either the owner, group, or who field of an ACL), was unknown.',
    },
    17: {
        error: 'Lock conflict',
        description: 'The file could not be opened because it is locked by another process.',
    },
    18: {
        error: 'Directory not empty',
        description: 'The directory is not empty.',
    },
    19: {
        error: 'Not a directory',
        description: 'The specified file is not a directory.',
    },
    20: {
        error: 'Invalid filename',
        description: 'The filename is not valid.',
    },
    21: {
        error: 'Link loop',
        description: 'Too many symbolic links encountered or an SSH_FXF_NOFOLLOW encountered a symbolic link as the final component.',
    },
    22: {
        error: 'Cannot delete',
        description: 'The file cannot be deleted. One possible reason is that the advisory read-only attribute-bit is set.',
    },
    23: {
        error: 'Invalid parameter',
        description: 'One of the parameters was out of range or the parameters specified cannot be used together.',
    },
    24: {
        error: 'File is a directory',
        description: 'The specified file was a directory in a context where a directory cannot be used.',
    },
    25: {
        error: 'Range lock conflict',
        description: 'A read or write operation failed because another process’s mandatory byte-range lock overlaps with the request.',
    },
    26: {
        error: 'Range lock refused',
        description: 'A request for a byte range lock was refused.',
    },
    27: {
        error: 'Delete pending',
        description: 'An operation was attempted on a file for which a delete operation is pending.',
    },
    28: {
        error: 'File corrupt',
        description: 'The file is corrupt; a filesystem integrity check should be run.',
    },
    29: {
        error: 'Owner invalid',
        description: 'The principal specified cannot be assigned as an owner of a file.',
    },
    30: {
        error: 'Group invalid',
        description: 'The principal specified cannot be assigned as the primary group of a file.',
    },
    31: {
        error: 'No matching byte range lock',
        description: 'The requested operation could not be completed because the specified byte range lock has not been granted.',
    },
};

export function getSftpError(code: number): sFtpError {
    const error = sftpErrors[code];
    return error ?? { error: 'Unknown error code' };
}