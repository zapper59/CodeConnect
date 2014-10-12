package com.toastedbits.plugins.codeconnect;

import javax.ws.rs.client.Client;

import org.gradle.api.DefaultTask;
import org.gradle.api.tasks.TaskAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.utils.JerseyClientFactory;

public class ReportUpstreamTask extends DefaultTask {
	private static final Logger LOG = LoggerFactory.getLogger(ReportUpstreamTask.class);

	@TaskAction
	public void reportUpstream() {
		try {
			CodeConnectGradleExtension ext = getProject().getExtensions().findByType(CodeConnectGradleExtension.class);
			DependencyMapping mapping = GradleDependencyMappingUtil.buildDependencyMapping(getProject());
			Client client = JerseyClientFactory.buildClient(ext.getUsername(), ext.getPassword());
			CodeConnectUpstreamReporter reporter = new CodeConnectNeo4jUpstreamReporter(client, ext.getUrl());
			reporter.reportUpstream(mapping, System.out);
		}
		catch(CodeConnectException e) {
			LOG.error("Problem reprting upstream dependencies", e);
		}
	}
}
