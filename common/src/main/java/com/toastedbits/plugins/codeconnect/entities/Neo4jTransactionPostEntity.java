package com.toastedbits.plugins.codeconnect.entities;

import java.util.List;

public class Neo4jTransactionPostEntity {
	private List<Neo4jTransactionStatement> statements;

	public List<Neo4jTransactionStatement> getStatements() {
		return statements;
	}

	public void setStatements(List<Neo4jTransactionStatement> statements) {
		this.statements = statements;
	}
}
