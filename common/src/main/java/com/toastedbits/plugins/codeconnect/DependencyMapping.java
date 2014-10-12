package com.toastedbits.plugins.codeconnect;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Provides mapping from Configuration/Scope => Dependencies
 */
public class DependencyMapping {
	private Map<String, Set<MavenCoordinate>> mapping = new HashMap<>();
	private MavenCoordinate project;

	public DependencyMapping(MavenCoordinate project) {
		this.project = project;
	}

	public void addMapping(String config, MavenCoordinate coordinate) {
		Set<MavenCoordinate> deps = mapping.get(config);
		if(deps == null) {
			deps = new HashSet<>();
			mapping.put(config, deps);
		}
		deps.add(coordinate);
	}

	public void addMapping(String config, String gradleCoordinate) {
		addMapping(config, new MavenCoordinate(gradleCoordinate));
	}

	public Set<Map.Entry<String, Set<MavenCoordinate>>> getEntries() {
		return mapping.entrySet();
	}

	public MavenCoordinate getProject() {
		return project;
	}

	public boolean isEmpty() {
		for(Map.Entry<String, Set<MavenCoordinate>> entry : mapping.entrySet()) {
			Set<MavenCoordinate> dependencies = entry.getValue();
			if(!dependencies.isEmpty()) {
				return false;
			}
		}

		return true;
	}
}
