package com.activepieces.common.identity;


import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.github.ksuid.Ksuid;

import java.io.IOException;

public class APIdSerializer extends StdSerializer<Ksuid> {

  public APIdSerializer() {
    this(null);
  }

  public APIdSerializer(Class<Ksuid> t) {
    super(t);
  }

  @Override
  public void serialize(Ksuid value, JsonGenerator jgen, SerializerProvider provider)
      throws IOException {
      jgen.writeString(value.toString());
  }

}
