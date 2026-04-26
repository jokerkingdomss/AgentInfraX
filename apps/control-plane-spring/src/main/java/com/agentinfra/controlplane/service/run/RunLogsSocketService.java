package com.agentinfra.controlplane.service.run;

import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class RunLogsSocketService {

    private final SocketIONamespace runsNamespace;

    @Autowired
    public RunLogsSocketService(SocketIOServer server) {
        this.runsNamespace = server.addNamespace("/runs");

        runsNamespace.addConnectListener(client ->
                log.info("Client connected: {} from {}", client.getSessionId(), client.getRemoteAddress()));

        runsNamespace.addDisconnectListener(client ->
                log.info("Client disconnected: {}", client.getSessionId()));

        runsNamespace.addEventListener("join-run", String.class, (client, runId, ackSender) -> {
            client.joinRoom("run:" + runId);
            log.debug("client {} joined room run:{}", client.getSessionId(), runId);
            ackSender.sendAckData(Map.of("joined", runId));
        });

        runsNamespace.addEventListener("leave-run", String.class, (client, runId, ackSender) -> {
            client.leaveRoom("run:" + runId);
            log.debug("client {} left room run:{}", client.getSessionId(), runId);
            ackSender.sendAckData(Map.of("left", runId));
        });

        log.info("RunLogsSocketService initialized on namespace /runs");
        server.start();
        log.info("Socket.IO server started on port {}", server.getConfiguration().getPort());
    }

    public void emitLogAppended(String runId, Map<String, Object> log) {
        runsNamespace.getRoomOperations("run:" + runId).sendEvent("run-log-appended", log);
    }

    public void emitStatusUpdated(String runId, String status) {
        runsNamespace.getRoomOperations("run:" + runId).sendEvent("run-status-updated",
                Map.of("runId", runId, "status", status));
    }
}
