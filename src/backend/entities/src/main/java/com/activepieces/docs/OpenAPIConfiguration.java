package com.activepieces.docs;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
    info =
        @Info(
            title = "Activepieces API Reference",
            description = "Complete reference documentation for the Activepieces API.\n",
            contact =
                @Contact(
                    name = "Activepieces Support",
                    url = "https://activepieces.com",
                    email = "support@activepieces.com")),
    servers = @Server(url = "https://api.activepieces.com"))
public class OpenAPIConfiguration {


}
