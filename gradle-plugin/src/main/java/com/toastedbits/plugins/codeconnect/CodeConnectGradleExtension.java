package com.toastedbits.plugins.codeconnect;

public class CodeConnectGradleExtension {
	public static final String EXT_PROTOCOL = "protocol";
	public static final String EXT_HOST = "host";
	public static final String EXT_PORT = "port";
	public static final String EXT_USERNAME = "username";
	public static final String EXT_PASSWORD = "password";

	private String url = Neo4jDefaults.URL;

	//Only use auth if at least one is declared, therefore do not assign default value here
	private String username;
	private String password;

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
}
