package com.toastedbits.plugins.codeconnect;

import javax.ws.rs.client.Client;

import org.apache.commons.lang3.StringUtils;
import org.gradle.api.DefaultTask;
import org.gradle.api.tasks.TaskAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.utils.CodeConnectConfig;
import com.toastedbits.plugins.codeconnect.utils.JerseyClientFactory;

public class ShowDownstreamTask extends DefaultTask {
	private static final Logger LOG = LoggerFactory.getLogger(ShowDownstreamTask.class);

	private MavenCoordinate getUpstreamTarget() {
		String upstreamValue = (String)System.getProperty(CodeConnectConfig.UPSTREAM);
		if(StringUtils.isNotEmpty(upstreamValue)) {
			return new MavenCoordinate(upstreamValue);
		}
		else {
			return GradleDependencyMappingUtil.buildMavenCoordinate(getProject());
		}
	}

	@TaskAction
	public void showDownstream() throws CodeConnectException {
		CodeConnectGradleExtension ext = getProject().getExtensions().findByType(CodeConnectGradleExtension.class);

		try {
			Client client = JerseyClientFactory.buildClient(ext.getUsername(), ext.getPassword());
			CodeConnectDownstreamReporter reporter = new CodeConnectNeo4jDownstreamReporter(client, ext.getUrl());
			reporter.showDownstream(getUpstreamTarget(), ext.getOutputStream());
		}
		//Prevent exceptions from bubbling out out
		catch(RuntimeException | CodeConnectException e) {
			if(ext.isFailOnException()) {
				throw e;
			}
			LOG.error("Problem showing downstream dependencies", e);
		}
	}
}
