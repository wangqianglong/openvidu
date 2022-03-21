package io.openvidu.server.utils;

import io.openvidu.server.kurento.kms.Kms;

public interface MediaNodeManager {

	public void mediaNodeUsageRegistration(Kms kms, long timeOfConnection);

	public void mediaNodeUsageDeregistration(Kms kms, long timeOfDisconnection);

	public void dropIdleMediaNode(String mediaNodeId);

	public boolean isLaunching(String mediaNodeId);

	public boolean isCanceled(String mediaNodeId);

	public boolean isRunning(String mediaNodeId);

	public boolean isTerminating(String mediaNodeId);

	public boolean isWaitingIdleToTerminate(String mediaNodeId);

}