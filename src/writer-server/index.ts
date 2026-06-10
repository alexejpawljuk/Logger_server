import {Server} from "rpc-websockets";
import {WriterServer} from "./Writer-server";
import winston from "winston";
import {LogStorage} from "../log-storage/Log-storage";
import {env} from "../config/env";

const logger = winston.createLogger({
    level: "silly",
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: env.LOG_FILE_PATH,
            maxsize: env.LOG_MAX_SIZE,
            tailable: true,
        }),
    ],
});

const wsServer = new Server({
    port: env.WRITER_SERVER_PORT,
    host: env.WRITER_SERVER_HOST,
})
const logStorage = new LogStorage(logger, env.LOG_FILE_PATH);
const writerServer = new WriterServer(wsServer, logStorage)

writerServer
    .start()
    .then(() => {
        console.log(`Writer-server started on port:${env.WRITER_SERVER_PORT}`);
    })
    .catch(console.error);
