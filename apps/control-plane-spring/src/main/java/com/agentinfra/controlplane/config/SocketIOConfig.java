package com.agentinfra.controlplane.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ExceptionListener;
import io.netty.channel.ChannelHandlerContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;

@Slf4j
@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    @Value("${netty-socket-io.hostname:0.0.0.0}")
    private String hostname;

    @Value("${netty-socket-io.port:10065}")
    private int port;

    @Value("${netty-socket-io.ping-interval:25000}")
    private int pingInterval;

    @Value("${netty-socket-io.ping-timeout:60000}")
    private int pingTimeout;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(hostname);
        config.setPort(port);
        config.setPingInterval(pingInterval);
        config.setPingTimeout(pingTimeout);
        config.setOrigin("http://localhost:3000");
        config.setExceptionListener(new ExceptionListener() {
            @Override
            public void onEventException(Exception e, List<Object> args, SocketIOClient client) {
                log.error("Socket.IO event exception for client {}", client.getSessionId(), e);
            }

            @Override
            public void onDisconnectException(Exception e, SocketIOClient client) {
                log.error("Socket.IO disconnect exception for client {}", client.getSessionId(), e);
            }

            @Override
            public void onConnectException(Exception e, SocketIOClient client) {
                log.error("Socket.IO connect exception for client {}", client.getSessionId(), e);
            }

            @Override
            public void onPingException(Exception e, SocketIOClient client) {
                log.error("Socket.IO ping exception for client {}", client.getSessionId(), e);
            }

            @Override
            public void onPongException(Exception e, SocketIOClient client) {
                log.error("Socket.IO pong exception for client {}", client.getSessionId(), e);
            }

            @Override
            public boolean exceptionCaught(ChannelHandlerContext ctx, Throwable e) throws Exception {
                log.error("Socket.IO channel exception", e);
                return true;
            }

            @Override
            public void onAuthException(Throwable e, SocketIOClient client) {
                log.error("Socket.IO auth exception for client {}", client.getSessionId(), e);
            }
        });
        return new SocketIOServer(config);
    }
}
