import {LOG_LEVEL} from "../constants/log-level";

export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL];

export interface ILog {
    eventTimestamp: number;         // Timestamp when the event occurred on the client.
    receivedTimestamp?: number;     // Timestamp when the log was received by LogServer.
    message: string;
    level: LogLevel
}

export type LogSearchQuery = {
    level?: LogLevel;
    message?: string;
    from?: number;
    to?: number;
};