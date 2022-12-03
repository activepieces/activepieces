package com.activepieces.common.pagination;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;

public class CursorDeserializer extends StdDeserializer<Cursor> {

  public CursorDeserializer() {
    this(null);
  }

  public CursorDeserializer(Class<Cursor> t) {
    super(t);
  }

  @Override
  public Cursor deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JacksonException {
    String id = jsonParser.readValueAs(String.class);
    return new Cursor(id);
  }


}

