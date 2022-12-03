package com.activepieces.common.pagination;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;

@JsonSerialize(using = CursorSerializer.class)
@JsonDeserialize(using = CursorDeserializer.class)
@Getter
@AllArgsConstructor
public class Cursor {

    private final Ksuid id;
    private final PagePrefix prefix;

    public Cursor(final PagePrefix prefix, final Ksuid id) {
        this.id = id;
        this.prefix = prefix;
    }

    public Cursor(String base64){
        String decodedString = new String(Base64.getDecoder().
                decode(base64.getBytes(StandardCharsets.UTF_8)));
        String[] split = decodedString.split("@");
        prefix = PagePrefix.valueOf(split[0]);
        id = Ksuid.fromString(split[1]);
    }

    @Override
    public String toString() {
        String finalString = String.format("%s@%s",
                prefix.toString().toUpperCase(Locale.ROOT),
                id.toString());
        return Base64.getEncoder().encodeToString(finalString.getBytes());
    }

}
