import {ILog, LogSearchQuery} from "./log";

export interface ILogStorage {
    writeLog(log: ILog): void;
    readLogs(): Promise<ILog[]>;
    searchLogs(query: LogSearchQuery): Promise<ILog[]>;
}