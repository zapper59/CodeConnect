package com.toastedbits.plugins.codeconnect.exceptions;

public class Neo4jRestException extends CodeConnectException {
	private static final long serialVersionUID = 8101166869433996236L;

	public Neo4jRestException() {}
	
	public Neo4jRestException(final String message) {
		super(message);
	}

	public Neo4jRestException(final Throwable cause) {
		super(cause);
	}

	public Neo4jRestException(final String message, final Throwable cause) {
		super(message, cause);
	}
}
