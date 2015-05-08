CodeConnect UI
==============

This is a javascript based web UI designed for visualizing Maven based project dependencies hosted on a Neo4j graph database.
It is build around the D3 javascript framework, and is designed to communicate with a Neo4j server.

Prerequisites
* Setup a Neo4j server:  http://neo4j.com/blog/the-neo4j-rest-server-part1-get-it-going/
* This application is designed to visualize Maven based projects, therefore each node on your Neo4j database should have a "name", "group", and "version" attribute.
* Ideally setup a continuous integration solution to populate your Neo4j database.  We are using a gradle plugin hosted at: https://github.com/AlexBarnes86/gradleScripts/blob/master/downstream.gradle
* Change the URL in neo4j.js to match your Neo4j server.

Usage
* Setup the war file at target/codeconnect.war with your server (we are using tomcat).
