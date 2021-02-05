/*
 * (C) Copyright 2021 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { OpenViduLogger } from '../../../../Logger/OpenViduLogger';


const logger: OpenViduLogger = OpenViduLogger.getInstance();

export class WebSocketWithReconnection {

	config;
	closing;
	registerMessageHandler;
	wsUri;
	ws;
	reconnecting;

	MAX_RETRIES = 2000; // Forever...
	RETRY_TIME_MS = 3000; // FIXME: Implement exponential wait times...
	CONNECTING = 0;
	OPEN = 1;
	CLOSING = 2;
	CLOSED = 3;

	constructor(config){
		this.config = config;
		this.closing = false;
		this.registerMessageHandler;
		this.wsUri = config.uri;
    	this.reconnecting = false;
		this.ws = this.createWebSocket();

		this.ws.onopen = () => {
			logger.debug("WebSocket connected to " + this.wsUri);
			if (config.onconnected) {
				config.onconnected();
			}
		};

		this.ws.onerror = error => {
			logger.error(
				"Could not connect to " + this.wsUri + " (invoking onerror if defined)",
				error
			);
			if (config.onerror) {
				config.onerror(error);
			}
		};



		this.ws.onclose = this.reconnectionOnClose;
	}

	reconnectionOnClose = () => {
		if (this.ws.readyState === this.CLOSED) {
			if (this.closing) {
				logger.debug("Connection closed by user");
			} else {
				logger.debug("Connection closed unexpectecly. Reconnecting...");
				this.reconnect(this.MAX_RETRIES, 1);
			}
		} else {
			logger.debug("Close callback from previous websocket. Ignoring it");
		}
	};

	reconnect(maxRetries, numRetries) {
        logger.debug(
            "reconnect (attempt #" + numRetries + ", max=" + maxRetries + ")"
        );
        if (numRetries === 1) {
            if (this.reconnecting) {
                logger.warn(
                    "Trying to reconnect when already reconnecting... Ignoring this reconnection."
                );
                return;
            } else {
                this.reconnecting = true;
            }
            if (this.config.onreconnecting) {
                this.config.onreconnecting();
            }
        }
        this.reconnectAux(maxRetries, numRetries);
    }

    reconnectAux(maxRetries, numRetries) {
        logger.debug("Reconnection attempt #" + numRetries);
        this.ws.close();
        this.ws = this.createWebSocket();

        this.ws.onopen = () => {
            logger.debug(
                "Reconnected to " + this.wsUri + " after " + numRetries + " attempts..."
            );
            this.reconnecting = false;
            this.registerMessageHandler();
            if (this.config.onreconnected()) {
                this.config.onreconnected();
            }
			this.ws.onclose = this.reconnectionOnClose;
        };

        this.ws.onerror = error => {
            logger.warn("Reconnection error: ", error);
            if (numRetries === maxRetries) {
                if (this.config.ondisconnect) {
                    this.config.ondisconnect();
                }
            } else {
                setTimeout(() => {
                    this.reconnect(maxRetries, numRetries + 1);
                }, this.RETRY_TIME_MS);
            }
        };
    }

    close() {
        this.closing = true;
        this.ws.close();
    }

    reconnectWs() {
        logger.debug("reconnectWs");
        this.reconnect(this.MAX_RETRIES, 1);
    };

    send (message) {
        this.ws.send(message);
    };

    addEventListener(type, callback) {
        this.registerMessageHandler = () => {
            this.ws.addEventListener(type, callback);
        };
        this.registerMessageHandler();
    };

    protected createWebSocket(): WebSocket {
        return new WebSocket(this.wsUri);
    }
}