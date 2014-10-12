package com.toastedbits.plugins.codeconnect.entities;

import java.util.Map;

public class Neo4jTransactionStatement {
	private String statement;
	private Map<String, String> parameters;

	public String getStatement() {
		return statement;
	}
	public void setStatement(String statement) {
		this.statement = statement;
	}
	public Map<String, String> getParameters() {
		return parameters;
	}
	public void setParameters(Map<String, String> parameters) {
		this.parameters = parameters;
	}
}
