# CodeConnect
Help detect which projects are depending on old/deprecated libraries
Keep projects more in sync and up to date
Most useful when managing a large number of projects

## Prerequisites
* Neo4j server (local or centrally managed)
* Ensure all projects you wish to reportUpstream with have a group, name, and version set
* Configure build.gradle (in this folder) to point to your dependency manager and execute gradle uploadArchives from this folder (project root))
* Edit the buildscript dependencies section in your project build files to use your dependency manager (e.g. Artifactory, Nexus, Archiva, etc)
* Edit settings.gradle to use stable project names in all of your projects (1)

(1) Projects must always have a name. In gradle the default project name is the project folder name.
	This is bad since users of distributed version control systems can clone a project to any folder.
	You will hit this issue with Jenkis since it clones to a folder named workspace!

## Usage
CodeConnect currently provides two main components:
reportUpstream: report a project's dependencies to a database
showDownstream: show who uses a particular artifact (defaults to the current project)

* Run "gradle reportUpstream" in all of your projects, preferably as part of a continous integration solution (e.g. Jenkins)
* Run "gradle showDownstream" on demand to view downstream projects (note this only works if regularly updating upstream!)
* Access the neo4j database directly for complicated queries
* Use CodeConnect web interface

## Configuration
### System Properties (all optional, default values provided)
* codeconnect.readtimeout="5000"
* codeconnect.connecttimeout="5000"
* codeconnect.upstream="groupId:artifactId:version"

(Note: upstream defaults to the current project maven coordinates)

### Gradle Extension (all optional, defaults values provided)
codeconnect {
	url = "http://localhost:7474"
	username = "neo4j"
	password = "neo4j"
	outputStream = System.out
	failOnException = true
}

## Examples
gradle -Dcodeconnect.connecttimeout=1000 reportUpstream 
gradle -Dcodeconnect.upstream="log4j:log4j:4.12" showDownstream

## TODO
* Write better tests
* Use a container (docker) to spin up neo4j for tests
* Use proper snapshot/release jar handling
* Cleanup webapp (select and use a framework)
* Publish to mavenCentral and gradle plugin repository

## Release Notes
### 0.1.0
* Supports Neo4j backend, interfaces provided for supporting others (in theory), however plugin code would also need to be updated to make use of alternative backends
* Provides Gradle plugin (Maven is soon to come!)
* Most logic moved to common module
