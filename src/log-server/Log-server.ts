import {Server as WSServer} from "rpc-websockets";
import {METHOD_NAME} from "../constants/method-names";
import {ILogServer} from "../types/log-server";
import {IWriterClient} from "../types/writer-client";
import {ILog, LogSearchQuery} from "../types/log";
import {IValidator} from "../types/validator";
import {AppResponse} from "../types/responses";

/**
 * Public JSON-RPC API server.
 *
 * Validates incoming requests and delegates
 * storage operations to WriterServer.
 */

export class LogServer implements ILogServer {

    constructor(
        private readonly logServer: WSServer,
        private readonly writerClient: IWriterClient,
        private readonly logMessageValidator: IValidator<ILog>,
        private readonly logSearchValidator: IValidator<LogSearchQuery>,
    ) {
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {

            this.registerMethods()

            this.logServer.on("listening", resolve)

            this.logServer.on("error", reject)
        })
    }

    private registerMethods(): void {
        this.logServer.register(METHOD_NAME.LOG_MESSAGE, async (params): Promise<AppResponse<ILog>> => {
            const validationResult = this.logMessageValidator.validate(params)

            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            const log: ILog = {
                ...validationResult.data,
                receivedTimestamp: Date.now(),
            }

            const writeResult = await this.writerClient.writeLog(log)

            if (!writeResult.success) {
                return writeResult;
            }

            return writeResult
        })

        this.logServer.register(METHOD_NAME.GET_LOGS, (): Promise<AppResponse<ILog[]>> => {
            return this.writerClient.getLogs();
        })

        this.logServer.register(METHOD_NAME.SEARCH_LOGS, async (params): Promise<AppResponse<ILog[]>> => {
                const validationResult = this.logSearchValidator.validate(params);

                if (!validationResult.isValid) {
                    return {
                        success: false,
                        error: validationResult.error,
                    };
                }

                return this.writerClient.searchLogs(validationResult.data);
            }
        );
    }
}
