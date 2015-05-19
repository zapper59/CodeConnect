package com.toastedbits.plugins.codeconnect;

import org.gradle.api.Plugin;
import org.gradle.api.Project;

public class CodeConnectGradlePlugin implements Plugin<Project> {
	@Override
	public void apply(final Project project) {
		project.getExtensions().create("codeconnect", CodeConnectGradleExtension.class);
		project.getTasks().create("reportUpstream", ReportUpstreamTask.class);
		project.getTasks().create("showDownstream", ShowDownstreamTask.class);
	}
}
