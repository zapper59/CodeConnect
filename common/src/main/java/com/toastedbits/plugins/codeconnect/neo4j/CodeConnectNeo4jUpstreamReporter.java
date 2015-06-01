package com.toastedbits.plugins.codeconnect.neo4j;

import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response;

import com.toastedbits.plugins.codeconnect.CodeConnectUpstreamReporter;
import com.toastedbits.plugins.codeconnect.DependencyMapping;
import com.toastedbits.plugins.codeconnect.MavenCoordinate;
import com.toastedbits.plugins.codeconnect.entities.Neo4jTransactionPostEntity;
import com.toastedbits.plugins.codeconnect.entities.Neo4jTransactionStatement;
import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.exceptions.Neo4jRestException;

public class CodeConnectNeo4jUpstreamReporter implements CodeConnectUpstreamReporter {
	private final Neo4jEndpoint neo4j;
	private final Client client;
	private final String baseUrl;

	private DependencyMapping mapping;
	private PrintWriter writer;

	public CodeConnectNeo4jUpstreamReporter(Client client, String baseUrl) {
		this.client = client;
		this.baseUrl = baseUrl;
		this.neo4j = new Neo4jEndpoint(client, baseUrl);
	}

	@Override
	public void reportUpstream(final DependencyMapping mapping, OutputStream output) throws CodeConnectException {
		//Do not close the writer or use try-with-resources on it, will close the underlying stream
		PrintWriter writer = new PrintWriter(output);
		this.writer = writer;
		this.mapping = mapping;

		try {
			writer.println("Reporting upstream dependencies for project " + mapping.getProject());
			if(mapping.isEmpty()) {
				writer.println("This project has no dependencies configured");
				return;
			}
	
			int transactionId = neo4j.beginTransaction(client);
			resetNode(mapping.getProject(), transactionId);
			reportDependencies(mapping.getProject(), transactionId);
			neo4j.commitTransaction(client, transactionId);
		}
		finally {
			writer.flush();
		}
	}

	public void resetNode(MavenCoordinate coordinate, int transactionId) throws CodeConnectException {
		writer.println("> Refreshing project node for: " + 
				coordinate.getGroupId() + ":" + coordinate.getArtifactId()  + ":" + coordinate.getVersion());
		Neo4jTransactionPostEntity payload = new Neo4jTransactionPostEntity();
		List<Neo4jTransactionStatement> statements = new ArrayList<>();
		statements.add(neo4j.buildMergeStatement(coordinate));
		statements.add(neo4j.buildDeleteOutboundStatement(mapping.getProject()));
		payload.setStatements(statements);

		WebTarget target = client.target(baseUrl).path(Neo4jEndpoint.DB.Data.Transaction.path(transactionId));
		Response response = target.request().post(Entity.json(payload), Response.class);
		if(response.getStatus() != HttpServletResponse.SC_OK) {
			throw new Neo4jRestException("Failed with http [" + response.getStatus() + "] while refreshing node: " + 
					coordinate.getGroupId() + ":" + coordinate.getArtifactId()  + ":" + coordinate.getVersion());
		}
	}

	public void reportDependencies(MavenCoordinate project, int transactionId) throws CodeConnectException {
		for(Map.Entry<String, Set<MavenCoordinate>> configuration : mapping.getEntries()) {
			String configName = configuration.getKey();
			Set<MavenCoordinate> dependencies = configuration.getValue();

			Neo4jTransactionPostEntity postEntity = new Neo4jTransactionPostEntity();
			List<Neo4jTransactionStatement> statements = new ArrayList<>();
			postEntity.setStatements(statements);

			for(MavenCoordinate dependency : dependencies) {
				writer.println("> (" + configName + ") " + dependency.getGroupId() + ":" + dependency.getArtifactId() + ":" + dependency.getVersion());
				
				statements.add(neo4j.buildMergeStatement(dependency));
				statements.add(neo4j.buildAssociationStatement(project, configName, dependency));
			}

			WebTarget target = client.target(baseUrl).path(Neo4jEndpoint.DB.Data.Transaction.path(transactionId));
			target.request().post(Entity.json(postEntity), Response.class);
		}
	}
}
