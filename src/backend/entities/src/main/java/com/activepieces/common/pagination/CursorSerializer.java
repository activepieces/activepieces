package com.activepieces.common.pagination;


import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;

public class CursorSerializer extends StdSerializer<Cursor> {

  public CursorSerializer() {
    this(null);
  }

  public CursorSerializer(Class<Cursor> t) {
    super(t);
  }

  @Override
  public void serialize(Cursor value, JsonGenerator jgen, SerializerProvider provider)
      throws IOException {
      jgen.writeString(value.toString());
  }

}
