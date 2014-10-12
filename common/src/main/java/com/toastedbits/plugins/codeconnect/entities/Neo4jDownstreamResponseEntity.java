package com.toastedbits.plugins.codeconnect.entities;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.toastedbits.plugins.codeconnect.MavenCoordinate;
import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;
import com.toastedbits.plugins.codeconnect.exceptions.Neo4jRestException;

public class Neo4jDownstreamResponseEntity {
	private static final int GROUP_COL = 0;
	private static final int ARTIFACT_COL = 1;
	private static final int VERSION_COL = 2;
	private static final int CONFIGURATION_COL = 3;

	private List<String> columns;
	private List<List<String>> data;
	public List<String> getColumns() {
		return columns;
	}
	public void setColumns(List<String> columns) {
		this.columns = columns;
	}
	public List<List<String>> getData() {
		return data;
	}
	public void setData(List<List<String>> data) {
		this.data = data;
	}
	
	public Map<String, Set<MavenCoordinate>> toMapping() throws CodeConnectException {
		Map<String, Set<MavenCoordinate>> mapping = new HashMap<>();

		for(List<String> row : data) {
			String configuration = row.get(CONFIGURATION_COL);

			Set<MavenCoordinate> dependencies = mapping.get(configuration);
			if(dependencies == null) {
				dependencies = new HashSet<>();
				mapping.put(configuration, dependencies);
			}
			dependencies.add(new MavenCoordinate(row.get(GROUP_COL), row.get(ARTIFACT_COL), row.get(VERSION_COL)));
		}
		return mapping;
	}
}
