package com.toastedbits.plugins.codeconnect;

import java.io.OutputStream;

import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;

public interface CodeConnectDownstreamReporter {
	void showDownstream(final MavenCoordinate upstream, final OutputStream output) throws CodeConnectException;
}
