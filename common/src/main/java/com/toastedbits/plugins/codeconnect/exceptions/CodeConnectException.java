package com.toastedbits.plugins.codeconnect.exceptions;

public class CodeConnectException extends Exception {
	private static final long serialVersionUID = -3215135506596718922L;

	public CodeConnectException() {}

	public CodeConnectException(final String message) {
		super(message);
	}

	public CodeConnectException(final Throwable cause) {
		super(cause);
	}

	public CodeConnectException(final String message, final Throwable cause) {
		super(message, cause);
	}
}
