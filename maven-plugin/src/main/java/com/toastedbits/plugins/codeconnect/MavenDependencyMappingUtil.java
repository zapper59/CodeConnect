package com.toastedbits.plugins.codeconnect;

import java.util.List;

import org.apache.maven.model.Dependency;
import org.apache.maven.project.MavenProject;

public class MavenDependencyMappingUtil {
	private MavenDependencyMappingUtil() {}

	public static MavenCoordinate buildMavenCoordinate(MavenProject project) {
		return new MavenCoordinate(
				project.getGroupId().toString(), 
				project.getName().toString(), 
				project.getVersion().toString());
	}

	public static MavenCoordinate buildMavenCoordinate(Dependency dependency) {
		return new MavenCoordinate(
				dependency.getGroupId(),
				dependency.getArtifactId(),
				dependency.getVersion());
	}

	public static DependencyMapping buildDependencyMapping(MavenProject project) {
		MavenCoordinate coordinate = buildMavenCoordinate(project);
		DependencyMapping mapping = new DependencyMapping(coordinate);
		
		//TODO: Does Maven provide a type safe way of retrieving the dependency list?
		@SuppressWarnings("unchecked")
		List<Dependency> dependencies = project.getDependencies();
		for(Dependency dependency : dependencies) {
			mapping.addMapping(dependency.getScope(), buildMavenCoordinate(dependency));
		}
		return mapping;
	}
}
