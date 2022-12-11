package com.activepieces.common.error.exception.collection;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

public class CollectionInstanceNotFoundException  extends Exception implements ErrorResponseException {

    private final Ksuid collectionId;

    public CollectionInstanceNotFoundException(Ksuid collectionId) {
        super(String.format("Collection with id=%s has no instance", collectionId.toString()));
        this.collectionId = collectionId;
    }

    public Ksuid getCollectionId(){
        return collectionId;
    }

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.COLLECTION_INSTANCE_NOT_FOUND;
    }
}
