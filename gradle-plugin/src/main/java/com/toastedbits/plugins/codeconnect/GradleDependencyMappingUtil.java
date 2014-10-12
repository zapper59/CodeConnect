package com.toastedbits.plugins.codeconnect;

import org.gradle.api.Project;
import org.gradle.api.artifacts.Configuration;
import org.gradle.api.artifacts.Dependency;

public class GradleDependencyMappingUtil {
	private GradleDependencyMappingUtil() {}

	public static MavenCoordinate buildMavenCoordinate(Project project) {
		return new MavenCoordinate(
				project.getGroup().toString(), 
				project.getName().toString(), 
				project.getVersion().toString());
	}

	public static MavenCoordinate buildMavenCoordinate(Dependency dependency) {
		return new MavenCoordinate(
				dependency.getGroup(),
				dependency.getName(),
				dependency.getVersion());
	}
	public static DependencyMapping buildDependencyMapping(Project project) {
		MavenCoordinate coordinate = buildMavenCoordinate(project);
		DependencyMapping mapping = new DependencyMapping(coordinate);
		for(Configuration config : project.getConfigurations()) {
			for(Dependency dependency : config.getDependencies()) {
				mapping.addMapping(config.getName(), buildMavenCoordinate(dependency));
			}
		}
		return mapping;
	}
}
