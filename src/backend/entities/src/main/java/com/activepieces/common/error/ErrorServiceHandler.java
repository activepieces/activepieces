package com.activepieces.common.error;


import org.springframework.social.InternalServerErrorException;
import org.springframework.stereotype.Service;

@Service
public class ErrorServiceHandler {
    public InternalServerErrorException createInternalError(Exception e) throws InternalServerErrorException{
        return new InternalServerErrorException("ErrorServiceHandler", e.getMessage());
    }

    public InternalServerErrorException createInternalError(Class cl, Exception e) throws InternalServerErrorException{
        e.printStackTrace();
        return new InternalServerErrorException(cl.getName(), e.getMessage());
    }

    public InternalServerErrorException createInternalError(Class cl, String e) throws InternalServerErrorException{
        return new InternalServerErrorException(cl.getName(), e);
    }

}
