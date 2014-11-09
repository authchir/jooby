package org.jooby.test;

import static org.junit.Assert.assertEquals;

import org.apache.http.client.fluent.Request;
import org.junit.Test;

import com.typesafe.config.Config;
import com.typesafe.config.ConfigFactory;
import com.typesafe.config.ConfigValueFactory;

public class ConfigWithModuleFeature extends ServerFeature {

  {

    get("/", (req, rsp) -> rsp.send(req.getInstance(Config.class).getString("m1.prop")));

    use(ConfigFactory.empty()
        .withValue("application.secret", ConfigValueFactory.fromAnyRef("123"))
        .withValue("application.mode", ConfigValueFactory.fromAnyRef("mode")));
  }

  @Test
  public void property() throws Exception {
    assertEquals("m1.override", Request.Get(uri("/").build())
        .execute().returnContent()
        .asString());
  }

}