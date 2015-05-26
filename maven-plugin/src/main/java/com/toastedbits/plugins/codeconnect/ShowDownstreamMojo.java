package com.toastedbits.plugins.codeconnect;

import javax.ws.rs.client.Client;

import org.apache.commons.lang3.StringUtils;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.project.MavenProject;

import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.utils.CodeConnectConfig;
import com.toastedbits.plugins.codeconnect.utils.JerseyClientFactory;

@Mojo(name = "showDownstream")
public class ShowDownstreamMojo extends AbstractMojo {
  @Parameter(defaultValue = "${project}", readonly = true)
  private MavenProject project;

  @Parameter(defaultValue = "true")
  private boolean failOnException;
  
  @Parameter(defaultValue = "neo4j")
  private String username;
  
  @Parameter(defaultValue = "neo4j")
  private String password;
  
  @Parameter(defaultValue = "http://localhost:7474")
  private String url;

  private MavenCoordinate getUpstreamTarget() {
    String upstreamValue = (String)System.getProperty(CodeConnectConfig.UPSTREAM);
    if(StringUtils.isNotEmpty(upstreamValue)) {
      return new MavenCoordinate(upstreamValue);
    }
    else {
      return new MavenCoordinate(project.getGroupId(), project.getArtifactId(), project.getVersion());
    }
  }

  public void execute() throws MojoFailureException {
    try {
      Client client = JerseyClientFactory.buildClient(username, password);
      CodeConnectDownstreamReporter reporter = new CodeConnectNeo4jDownstreamReporter(client, url);
      //TODO: is there a way to allow a user defined OutputStream in Maven?
      reporter.showDownstream(getUpstreamTarget(), System.out);
    }
    //Prevent exceptions from bubbling out out
    catch(RuntimeException | CodeConnectException e) {
      if(failOnException) {
        throw new MojoFailureException("Problem showing downstream dependencies", e);
      }
      getLog().error("Problem showing downstream dependencies", e);
    }
  }
}