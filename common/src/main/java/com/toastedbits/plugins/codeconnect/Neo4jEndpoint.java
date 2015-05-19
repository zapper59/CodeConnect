package com.toastedbits.plugins.codeconnect;

import java.net.URI;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
}
