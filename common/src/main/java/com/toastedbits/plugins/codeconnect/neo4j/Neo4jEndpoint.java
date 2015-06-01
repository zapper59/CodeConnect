package com.toastedbits.plugins.codeconnect.neo4j;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.toastedbits.plugins.codeconnect.MavenCoordinate;
import com.toastedbits.plugins.codeconnect.entities.Neo4jTransactionStatement;
import com.toastedbits.plugins.codeconnect.exceptions.Neo4jRestException;

public class Neo4jEndpoint {
	private static final Logger LOG = LoggerFactory.getLogger(Neo4jEndpoint.class);

	private final String baseUrl;

	public Neo4jEndpoint(final Client client, final String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public static class DB {
		public static String path() {
			return "db";
		}

		public static class Data {
			public static String path() {
				return "db/data";
			}

			public static class Transaction {
				public static String path() {
					return "db/data/transaction";
				}
				
				public static String path(int id) {
					return "db/data/transaction/" + id;
				}
				
				public static class Commit {
					public static String path(int id) {
						return "db/data/transaction/" + id + "/commit";
					}
				}
			}

			public static class Cypher {
				public static String path() {
					return "db/data/cypher";
				}
			}
		}
	}

	public int beginTransaction(Client client) throws Neo4jRestException {
		WebTarget target = client.target(baseUrl).path(DB.Data.Transaction.path());
		Response response = target.request(MediaType.APPLICATION_JSON)
				.post(null, Response.class);

		if(response.getStatus() != HttpServletResponse.SC_CREATED) {
			throw new Neo4jRestException("Failed to begin transaction, status code: " + response.getStatus());
		}
		
		URI location = response.getLocation();
		String segments[] = location.toString().split("/");
		return Integer.parseInt(segments[segments.length-1]);
	}

	public void commitTransaction(Client client, Integer id) throws Neo4jRestException {
		LOG.debug("Committing Transaction");
		WebTarget target = client.target(baseUrl).path(DB.Data.Transaction.Commit.path(id));
		Response response = target.request(MediaType.APPLICATION_JSON)
				.post(null, Response.class);
		
		if(response.getStatus() != HttpServletResponse.SC_OK) {
			throw new Neo4jRestException("Failed to commit transaction, status code: " + response.getStatus());
		}
	}

	public Map<String, String> buildNodeParameters(MavenCoordinate coordinate) {
		Map<String, String> parameters = new LinkedHashMap<>();
		parameters.put("projectName", coordinate.getArtifactId());
		parameters.put("projectGroup", coordinate.getGroupId());
		parameters.put("projectVersion", coordinate.getVersion());
		return parameters;
	}

	public Neo4jTransactionStatement buildMergeStatement(MavenCoordinate coordinate) {
		Neo4jTransactionStatement statement = new Neo4jTransactionStatement();
		statement.setStatement("MERGE (proj:Project {name:{projectName}, group:{projectGroup}, version:{projectVersion}})");
		statement.setParameters(buildNodeParameters(coordinate));
		return statement;
	}
	
	public Neo4jTransactionStatement buildDeleteOutboundStatement(MavenCoordinate project) {
		Neo4jTransactionStatement statement = new Neo4jTransactionStatement();
		statement.setStatement("MATCH (down:Project {name:{projectName}, group:{projectGroup}, version:{projectVersion}})-[rel]->() DELETE rel");
		statement.setParameters(buildNodeParameters(project));
		return statement;
	}

	public Neo4jTransactionStatement buildAssociationStatement(MavenCoordinate child, String configName, MavenCoordinate parent) {
		Neo4jTransactionStatement statement = new Neo4jTransactionStatement();
		//At time of writing, neo4j restApi does not support parameterization on relation name
		statement.setStatement(
				"MATCH (c:Project {name:{childName}, group:{childGroup}, version:{childVersion}}), " +
				"(p:Project {name:{parentName}, group:{parentGroup}, version:{parentVersion}}) " +
				"MERGE (c)-[:" + configName + "]->(p)");
		Map<String, String> parameters = new LinkedHashMap<>();
		parameters.put("childName", child.getArtifactId());
		parameters.put("childGroup", child.getGroupId());
		parameters.put("childVersion", child.getVersion());
		parameters.put("parentName", parent.getArtifactId());
		parameters.put("parentGroup", parent.getGroupId());
		parameters.put("parentVersion", parent.getVersion());
		statement.setParameters(parameters);
		return statement;
	}
}
