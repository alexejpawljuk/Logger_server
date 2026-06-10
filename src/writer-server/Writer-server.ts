import {Server as WSServer} from "rpc-websockets";
import {METHOD_NAME} from "../constants/method-names";
import {IWriterServer} from "../types/writer-server";
import {AppResponse} from "../types/responses";
import {ILog, LogSearchQuery} from "../types/log";
import {ILogStorage} from "../types/log-storage";
import {ERROR_CODE} from "../constants/error-codes";

/**
 * Centralized storage coordinator.
 *
 * All LogServer instances delegate persistence operations
 * to WriterServer to prevent concurrent writes to log files.
 */

export class WriterServer implements IWriterServer {

    constructor(
        private readonly writerServer: WSServer,
        private readonly logStorage: ILogStorage,
    ) {
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.registerMethods()

            this.writerServer.on("listening", resolve)

            this.writerServer.on("error", reject)
        })
    }

    private registerMethods(): void {
        this.writerServer.register(METHOD_NAME.WRITE_LOG, (params): AppResponse<ILog> => {
            this.logStorage.writeLog(params as ILog)

            return {
                success: true,
                data: params as ILog,
            }
        })

        this.writerServer.register(METHOD_NAME.READ_LOGS, async (): Promise<AppResponse<ILog[]>> => {
            try {
                const logs = await this.logStorage.readLogs()

                return {
                    success: true,
                    data: logs,
                }
            } catch (error) {
                const err = error as Error;

                return {
                    success: false,
                    error: {
                        code: ERROR_CODE.READ_LOGS_FAILED,
                        message: err.message,
                    },
                };
            }
        })

        this.writerServer.register(METHOD_NAME.SEARCH_STORED_LOGS, async (params): Promise<AppResponse<ILog[]>> => {
            try {
                const logs = await this.logStorage.searchLogs(params as LogSearchQuery)

                return {
                    success: true,
                    data: logs,
                }
            } catch (error) {
                const err = error as Error;

                return {
                    success: false,
                    error: {
                        code: ERROR_CODE.SEARCH_LOGS_FAILED,
                        message: err.message,
                    },
                };
            }
        })
    }
}