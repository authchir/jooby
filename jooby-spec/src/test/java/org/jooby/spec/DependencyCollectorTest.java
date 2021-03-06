package org.jooby.spec;

import static org.junit.Assert.assertEquals;

import java.util.Set;

import org.jooby.internal.spec.DependencyCollector;
import org.junit.Test;

import com.github.javaparser.ParseException;
import com.google.common.collect.Sets;

public class DependencyCollectorTest extends ASTTest {

  @Test
  public void shouldCollectDependencies() throws ParseException {
    Set<String> deps = new DependencyCollector().accept(source("package myapp;\n"
        + "import org.jooby.Jooby;\n"
        + "import java.util.*;\n"
        + "import l1.Type;\n"
        + "import l1.*;\n"
        + "public class App extends Jooby {\n"
        + "  {\n"
        + "  }\n"
        + "}\n"));
    assertEquals(
        Sets.newHashSet("java.lang", "myapp", "org.jooby.Jooby", "java.util", "l1.Type", "l1"),
        deps);
  }

}
