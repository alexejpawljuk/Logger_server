import {IWriterClient} from "../types/writer-client";
import {Client} from "rpc-websockets";
import {METHOD_NAME} from "../constants/method-names";
import {ILog, LogSearchQuery} from "../types/log";
import {AppResponse} from "../types/responses";
import {ERROR_CODE} from "../constants/error-codes";

export class WriterClient implements IWriterClient{
    constructor(
        private readonly writerClient: Client
    ) {}

    async writeLog(param: ILog): Promise<AppResponse<ILog>> {
        try {
            return await this.writerClient.call(METHOD_NAME.WRITE_LOG, param) as Promise<AppResponse<ILog>>;
        } catch (error) {
            const err = error as Error;

            return {
                success: false,
                error: {
                    code: ERROR_CODE.WRITER_UNAVAILABLE,
                    message: err.message,
                },
            };
        }
    }

    async getLogs(): Promise<AppResponse<ILog[]>> {
        try {
            return await this.writerClient.call(METHOD_NAME.READ_LOGS) as Promise<AppResponse<ILog[]>>;
        } catch (error) {
            const err = error as Error;

            return {
                success: false,
                error: {
                    code: ERROR_CODE.WRITER_UNAVAILABLE,
                    message: err.message,
                },
            };
        }

    }

    async searchLogs(query: LogSearchQuery): Promise<AppResponse<ILog[]>> {
        try {
            return await this.writerClient.call(METHOD_NAME.SEARCH_STORED_LOGS, query) as Promise<AppResponse<ILog[]>>;
        } catch (error) {
            const err = error as Error;

            return {
                success: false,
                error: {
                    code: ERROR_CODE.WRITER_UNAVAILABLE,
                    message: err.message,
                },
            };
        }
    }
}