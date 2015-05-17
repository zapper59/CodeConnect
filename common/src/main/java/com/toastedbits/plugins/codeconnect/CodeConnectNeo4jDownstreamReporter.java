package com.toastedbits.plugins.codeconnect;

import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.toastedbits.plugins.codeconnect.entities.Neo4jCypherPostEntity;
import com.toastedbits.plugins.codeconnect.entities.Neo4jDownstreamResponseEntity;
import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.exceptions.Neo4jRestException;

public class CodeConnectNeo4jDownstreamReporter implements CodeConnectDownstreamReporter {
	private final Client client;
	private final String baseUrl;

	public CodeConnectNeo4jDownstreamReporter(final Client client, final String baseUrl) {
		this.client = client;
		this.baseUrl = baseUrl;
	}

	private boolean isMappingEmpty(Map<String, Set<MavenCoordinate>> mapping) {
		for(Map.Entry<String, Set<MavenCoordinate>> entry : mapping.entrySet()) {
			if(!entry.getValue().isEmpty()) {
				return false;
			}
		}
		return true;
	}
	@Override
	public void showDownstream(MavenCoordinate upstream, OutputStream output) throws CodeConnectException {
		//Do not close the writer or use try-with-resources on it, will close the underlying stream
		PrintWriter writer = new PrintWriter(output);
		try {
			Neo4jCypherPostEntity postEntity = new Neo4jCypherPostEntity();
			postEntity.setQuery(
					"MATCH (up:Project {name:{projectName}, group:{projectGroup}, version:{projectVersion}})" +
					"<-[rel]-(down) " +
					"RETURN down.name, down.group, down.version, type(rel)");
			Map<String, String> params = new LinkedHashMap<>();
			params.put("projectName", upstream.getArtifactId());
			params.put("projectGroup", upstream.getGroupId());
			params.put("projectVersion", upstream.getVersion());
			postEntity.setParams(params);
	
			WebTarget target = client.target(baseUrl).path(Neo4jEndpoint.DB.Data.Cypher.path());
			Response response = target.request(MediaType.APPLICATION_JSON).post(Entity.json(postEntity), Response.class);
			
			if(response.getStatus() != HttpServletResponse.SC_OK) {
				throw new Neo4jRestException("Failed to retrieve downstream information from neo4j");
			}
	
			writer.println("Downstream projects from " + upstream.getGroupId() + ":" + upstream.getArtifactId() + ":" + upstream.getVersion());
			Neo4jDownstreamResponseEntity entity = response.readEntity(Neo4jDownstreamResponseEntity.class);
			Map<String, Set<MavenCoordinate>> mapping = entity.toMapping();
	
			if(isMappingEmpty(mapping)) {
				writer.println("< No downstream projects found");
				return;
			}
			for(Map.Entry<String, Set<MavenCoordinate>> entry : mapping.entrySet()) {
				String config = entry.getKey();
				for(MavenCoordinate dependency : entry.getValue()) {
					writer.println("< (" + config + ") " + dependency);
				}
			}
		}
		finally {
			writer.flush();
		}
	}
}
