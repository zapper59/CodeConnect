package com.toastedbits.plugins.codeconnect;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

/**
 * Immutable class to represent dependencies on maven formatted repositories.
 * 
 * @author alex
 */
public class MavenCoordinate {
	private String artifactId;
	private String groupId;
	private String version;

	//Optional
	private String classifier;
	
	private static final String INVALID_PARAMETERS = "Must provide groupId, artifactId, and version";

	/**
	 * Shorthand syntax for dependencies. groupId:artifactId:version:classifier
	 * classifier is optional
	 * 
	 * e.g. "javax.servlet:javax.servlet-api:3.1.0"
	 * @param gradleString
	 */
	public MavenCoordinate(String gradleString) {
		if(StringUtils.isEmpty(gradleString)) {
			throw new IllegalArgumentException(INVALID_PARAMETERS);
		}
		String[] tokens = gradleString.split(":");
		if(tokens.length < 3) {
			throw new IllegalArgumentException(INVALID_PARAMETERS);
		}
		this.groupId = tokens[0];
		this.artifactId = tokens[1];
		this.version = tokens[2];
		this.classifier = tokens.length >= 4 ? tokens[3] : null;
	}
	public MavenCoordinate(String groupId, String artifactId, String version) {
		this(groupId, artifactId, version, null);
	}
	public MavenCoordinate(String groupId, String artifactId, String version, String classifier) {
		if(groupId == null || artifactId == null || version == null) {
			throw new IllegalArgumentException(INVALID_PARAMETERS);
		}

		this.groupId = groupId;
		this.artifactId = artifactId;
		this.version = version;
		this.classifier = classifier;
	}

	public String getArtifactId() {
		return artifactId;
	}
	public String getGroupId() {
		return groupId;
	}
	public String getVersion() {
		return version;
	}
	public String getClassifier() {
		return classifier;
	}
	public boolean hasClassifier() {
		return StringUtils.isNotEmpty(classifier);
	}
	@Override
	public String toString() {
		String coordinate = groupId + ":" + artifactId + ":" + version;
		if(StringUtils.isNotEmpty(classifier)) {
			coordinate += ":" + coordinate;
		}
		return coordinate;
	}
	@Override
	public boolean equals(Object o) {
		return EqualsBuilder.reflectionEquals(this, o);
	}
	@Override
	public int hashCode() {
		return HashCodeBuilder.reflectionHashCode(this);
	}
}
