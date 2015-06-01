package com.toastedbits.plugins.codeconnect;

import javax.ws.rs.client.Client;

import org.apache.commons.lang3.StringUtils;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.project.MavenProject;

import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.utils.JerseyClientFactory;
import com.toastedbits.plugins.codeconnect.utils.Neo4jDefaults;

@Mojo(name = "reportUpstream")
public class ReportUpstreamMojo extends AbstractMojo
{
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

	private void applySystemPropertyOverrides() {
		String sysUrl = System.getProperty(Neo4jDefaults.URL);
		if(StringUtils.isNotEmpty(sysUrl)) {
			url = sysUrl;
		}

		String sysUsername = System.getProperty(Neo4jDefaults.USERNAME);
		if(StringUtils.isNotEmpty(sysUsername)) {
			username = sysUsername;
		}

		String sysPassword = System.getProperty(Neo4jDefaults.PASSWORD);
		if(StringUtils.isNotEmpty(sysPassword)) {
			password = sysPassword;
		}
	}
	
	public void execute() throws MojoFailureException {
		try {
			applySystemPropertyOverrides();
			DependencyMapping mapping = MavenDependencyMappingUtil.buildDependencyMapping(project);

			Client client = JerseyClientFactory.buildClient(username, password);
			CodeConnectUpstreamReporter reporter = new CodeConnectNeo4jUpstreamReporter(client, url);
			//TODO: Allow configurable OutputStream
			reporter.reportUpstream(mapping, System.out);
		}
		//Prevent exceptions from bubbling out out
		catch(RuntimeException | CodeConnectException e) {
			if(failOnException) {
				throw new MojoFailureException("Problem reporting upstream dependencies", e);
			}
			getLog().error("Problem reprting upstream dependencies", e);
		}
	}
}
