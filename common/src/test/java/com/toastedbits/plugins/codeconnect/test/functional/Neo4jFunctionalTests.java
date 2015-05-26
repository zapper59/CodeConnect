package com.toastedbits.plugins.codeconnect.test.functional;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;

import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.client.authentication.HttpAuthenticationFeature;
import org.junit.Ignore;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.toastedbits.plugins.codeconnect.CodeConnectDownstreamReporter;
import com.toastedbits.plugins.codeconnect.CodeConnectNeo4jDownstreamReporter;
import com.toastedbits.plugins.codeconnect.CodeConnectNeo4jUpstreamReporter;
import com.toastedbits.plugins.codeconnect.CodeConnectUpstreamReporter;
import com.toastedbits.plugins.codeconnect.DependencyMapping;
import com.toastedbits.plugins.codeconnect.MavenCoordinate;
import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;

@Ignore("Depends on local neo4j server configured")
public class Neo4jFunctionalTests {
	private static final Logger LOG = LoggerFactory.getLogger(Neo4jFunctionalTests.class);
	private static final Client CLIENT = buildClient("neo4j", "neo4j");
	private static final String BASE_URL = "http://localhost:7474";
	private static final String COMPILE = "compile";
	private static final String RUNTIME = "runtime";
	private static final String TEST_COMPILE = "testCompile";
	private static final String TEST_RUNTIME = "testRuntime";

	private static Client buildClient(final String username, final String password) {
		ClientConfig config = new ClientConfig();
		Client client = ClientBuilder.newClient(config);
		if(StringUtils.isNotEmpty(username) && StringUtils.isNotEmpty(password)) {
			LOG.info("Setting up authentication");
			HttpAuthenticationFeature feature = HttpAuthenticationFeature.basic(username, password);
			client.register(feature);
		}
//		To view Jersey HTTP activity for debugging: client.register(new LoggingFilter());
		return client;
	}

	@Test
	public void testReportUpstream() throws CodeConnectException {
		MavenCoordinate project = new MavenCoordinate("com.toastedbits.plugins.codeconnect", "common-test", "0.0.1");
		DependencyMapping mapping = new DependencyMapping(project);
		mapping.addMapping(COMPILE, "org.glassfish.jersey.core:jersey-client:2.17");
		mapping.addMapping(COMPILE, "org.apache.commons:commons-lang3:3.4");
		mapping.addMapping(COMPILE, "javax.servlet:javax.servlet-api:3.1.0");
		mapping.addMapping(COMPILE, "org.glassfish.jersey.media:jersey-media-json-jackson:2.17");
		mapping.addMapping(RUNTIME, "org.slf4j:jul-to-slf4j:1.7.12");
		mapping.addMapping(TEST_COMPILE, "junit:junit:4.12");
		mapping.addMapping(TEST_RUNTIME, "org.slf4j:slf4j-api:1.7.7");
		mapping.addMapping(TEST_RUNTIME, "org.apache.logging.log4j:log4j-slf4j-impl:2.2");
		mapping.addMapping(TEST_RUNTIME, "org.apache.logging.log4j:log4j-api:2.2");
		mapping.addMapping(TEST_RUNTIME, "org.apache.logging.log4j:log4j-core:2.2");
		
		CodeConnectUpstreamReporter reporter = new CodeConnectNeo4jUpstreamReporter(CLIENT, BASE_URL);
		reporter.reportUpstream(mapping, System.out);
	}

	@Test
	public void testReportDownstream() throws CodeConnectException {
		MavenCoordinate upstream = new MavenCoordinate("org.apache.logging.log4j:log4j-core:2.2");
		CodeConnectDownstreamReporter reporter = new CodeConnectNeo4jDownstreamReporter(CLIENT, BASE_URL);
		reporter.showDownstream(upstream, System.out);
	}
}