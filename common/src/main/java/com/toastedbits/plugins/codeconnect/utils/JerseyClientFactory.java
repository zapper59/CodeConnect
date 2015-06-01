package com.toastedbits.plugins.codeconnect.utils;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;

import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.client.ClientProperties;
import org.glassfish.jersey.client.authentication.HttpAuthenticationFeature;


public class JerseyClientFactory {
	public static Client buildClient(final String username, final String password) {
		Client client = ClientBuilder.newClient();
		//Only provide auth if at least one of username or password was provided
		//Fallback to default neo4j credentials if only one of username/passowrd was specified for the other param
		if(StringUtils.isNotEmpty(username) || StringUtils.isNotEmpty(password)) {
			String uname = username;
			if(StringUtils.isEmpty(uname)) {
				uname = Neo4jDefaults.USERNAME_DEFAULT;
			}
			String pword = password;
			if(StringUtils.isEmpty(pword)) {
				pword = Neo4jDefaults.PASSWORD_DEFAULT;
			}
			HttpAuthenticationFeature feature = HttpAuthenticationFeature.basic(uname, pword);
			client.register(feature);
		}
		int connectTimeout = Integer.parseInt(System.getProperty(CodeConnectConfig.CONNECT_TIMEOUT, CodeConnectConfig.CONNECT_TIMEOUT_DEFAULT));
		int readTimeout = Integer.parseInt(System.getProperty(CodeConnectConfig.READ_TIMEOUT, CodeConnectConfig.READ_TIMEOUT_DEFAULT));
		client.property(ClientProperties.CONNECT_TIMEOUT, connectTimeout);
		client.property(ClientProperties.READ_TIMEOUT, readTimeout);
		return client;
	}
}
