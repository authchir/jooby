package jooby;

import jooby.mvc.GET;
import jooby.mvc.Path;
import jooby.mvc.Produces;

import com.google.common.collect.ImmutableMap;

@Path("/resource")
public class Resource {

  @GET
//   @Produces({"text/html", "application/json"})
  @Produces({"application/json" })
//  @Produces({"*/*" })
  public Object index(final String name) {
    return ImmutableMap.builder()
        .put("name", name)
        .build();
  }
}