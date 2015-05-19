package com.toastedbits.plugins.codeconnect;

import java.io.OutputStream;

import com.toastedbits.plugins.codeconnect.exceptions.CodeConnectException;

public interface CodeConnectUpstreamReporter {
	void reportUpstream(final DependencyMapping mapping, final OutputStream output) throws CodeConnectException;
}
