package com.toastedbits.plugins.codeconnect.entities;

import java.util.Map;

public class Neo4jCypherPostEntity {
	private String query;
	private Map<String, String> params;
	public String getQuery() {
		return query;
	}
	public void setQuery(String query) {
		this.query = query;
	}
	public Map<String, String> getParams() {
		return params;
	}
	public void setParams(Map<String, String> params) {
		this.params = params;
	}
}
