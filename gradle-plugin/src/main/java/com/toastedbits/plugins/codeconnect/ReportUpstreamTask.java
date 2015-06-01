package com.toastedbits.plugins.codeconnect;

import javax.ws.rs.client.Client;

import org.gradle.api.DefaultTask;
import org.gradle.api.tasks.TaskAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.neo4j.CodeConnectNeo4jUpstreamReporter;
import com.toastedbits.plugins.codeconnect.utils.JerseyClientFactory;

public class ReportUpstreamTask extends DefaultTask {
	private static final Logger LOG = LoggerFactory.getLogger(ReportUpstreamTask.class);

	@TaskAction
	public void reportUpstream() throws CodeConnectException {
		CodeConnectGradleExtension ext = getProject().getExtensions().findByType(CodeConnectGradleExtension.class);

		try {
			DependencyMapping mapping = GradleDependencyMappingUtil.buildDependencyMapping(getProject());
			Client client = JerseyClientFactory.buildClient(ext.getUsername(), ext.getPassword());
			CodeConnectUpstreamReporter reporter = new CodeConnectNeo4jUpstreamReporter(client, ext.getUrl());
			reporter.reportUpstream(mapping, ext.getOutputStream());
		}
		//Prevent exceptions from bubbling out out
		catch(RuntimeException | CodeConnectException e) {
			if(ext.isFailOnException()) {
				throw e;
			}
			LOG.error("Problem reprting upstream dependencies", e);
		}
	}
}
