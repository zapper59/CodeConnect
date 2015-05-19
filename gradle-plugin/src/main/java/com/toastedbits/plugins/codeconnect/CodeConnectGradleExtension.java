package com.toastedbits.plugins.codeconnect;

import java.io.OutputStream;

//TODO: CodeConnect configuration is currently coupled to Neo4j.
/* 
 * Should be more like the following
 * codeconnect {
 *   neo4j {
 *     username = "neo4j"
 *     password = "neo4j"
 *     url = "http://localhost:7474"
 *   }
 * }
 */

public class CodeConnectGradleExtension {
	public static final String EXT_URL = "url";
	public static final String EXT_USERNAME = "username";
	public static final String EXT_PASSWORD = "password";
	public static final String EXT_FAIL_ON_EXCEPTION = "failOnException";
	public static final String EXT_OUTPUT_STREAM = "outputStream";

	public static final boolean DEFAULT_FAIL_ON_EXCEPTION = true;
	public static final OutputStream DEFAULT_OUTPUT_STREAM = System.out;

	private String url = Neo4jDefaults.URL;

	//Only use auth if at least one is declared, therefore do not assign default value here
	private String username;
	private String password;
	
	private boolean failOnException = DEFAULT_FAIL_ON_EXCEPTION;
	private OutputStream outputStream = DEFAULT_OUTPUT_STREAM;

	public String getUrl() {
		return url;
	}
	public void setUrl(String url) {
		this.url = url;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public boolean isFailOnException() {
		return failOnException;
	}
	public void setFailOnException(boolean failOnException) {
		this.failOnException = failOnException;
	}
	public OutputStream getOutputStream() {
		return outputStream;
	}
	public void setOutputStream(OutputStream outputStream) {
		this.outputStream = outputStream;
	}
}
