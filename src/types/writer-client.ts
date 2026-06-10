import {ILog, LogSearchQuery} from "./log";
import {AppResponse} from "./responses";


export interface IWriterClient {
    writeLog(param: ILog): Promise<AppResponse<ILog>>;
    getLogs(): Promise<AppResponse<ILog[]>>;
    searchLogs(query: LogSearchQuery): Promise<AppResponse<ILog[]>>;
}