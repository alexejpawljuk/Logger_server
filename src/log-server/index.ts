import {LogServer} from "./Log-server";
import {Client, Server} from "rpc-websockets";
import {WriterClient} from "../writer-client/Writer-client";
import {LogMessageValidator} from "../util/Log-message-validator";
import {LogSearchValidator} from "../util/Log-search-validator";
import {env} from "../config/env";

const wsServer = new Server({
    port: env.LOG_SERVER_PORT,
    host: env.LOG_SERVER_HOST
})

const wsClient = new Client(env.WRITER_SERVER_URL)

const logMessageValidator = new LogMessageValidator()
const logSearchValidator = new LogSearchValidator()
const writerClient = new WriterClient(wsClient)
const logServer = new LogServer(wsServer, writerClient, logMessageValidator, logSearchValidator)

logServer
    .start()
    .then(() => {
        console.log(`Log-server started on port:${env.LOG_SERVER_PORT}`);
    })
    .catch(console.error);