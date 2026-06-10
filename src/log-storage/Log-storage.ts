import {Logger} from "winston";
import {promises as fs} from "fs";
import path from "path";
import {ILogStorage} from "../types/log-storage";
import {ILog, LogSearchQuery} from "../types/log";
import {TIMESTAMP_FIELD} from "../constants/timestamp-fields";

/**
 * Storage layer responsible for log persistence,
 * retrieval and search operations across active
 * and archived log files.
 */

export class LogStorage implements ILogStorage {
    constructor(
        private readonly logger: Logger,
        private readonly logFilePath: string,
    ) {
    }

    writeLog(log: ILog): void {
        this.logger.log({
            level: log.level,
            message: log.message,
            eventTimestamp: log.eventTimestamp,
            receivedTimestamp: log.receivedTimestamp,
        })
    }

    async readLogs(): Promise<ILog[]> {
        try {
            const logDir = path.dirname(this.logFilePath);
            const files = await fs.readdir(logDir);

            const logFiles = files.filter(file => file.endsWith(".log"));

            const logs: ILog[] = [];

            for (const file of logFiles) {
                const fileContent = await fs.readFile(
                    path.join(logDir, file),
                    "utf-8",
                );

                logs.push(
                    ...fileContent
                        .split("\n")
                        .filter(line => line.trim() !== "")
                        .map(line => JSON.parse(line) as ILog),
                );
            }

            // Return logs in chronological order (oldest first)
            return logs.sort((a, b) =>
                (a.receivedTimestamp ?? 0) -
                (b.receivedTimestamp ?? 0),
            );
        } catch (error) {
            const nodeError = error as NodeJS.ErrnoException;

            if (nodeError.code === "ENOENT") {
                return [];
            }

            throw error;
        }
    }


    async searchLogs(query: LogSearchQuery): Promise<ILog[]> {
        const logs = await this.readLogs();

        const timestampField =
            query.timestampField ?? TIMESTAMP_FIELD.RECEIVED;

        return logs.filter((log) => {
            if (query.level && log.level !== query.level) {
                return false;
            }

            if (
                query.message &&
                !log.message.toLowerCase().includes(query.message.toLowerCase())
            ) {
                return false;
            }

            const timestamp = log[timestampField];

            if (
                (query.from !== undefined || query.to !== undefined) &&
                timestamp === undefined
            ) {
                return false;
            }

            if (query.from !== undefined && timestamp! < query.from) {
                return false;
            }

            if (query.to !== undefined && timestamp! > query.to) {
                return false;
            }

            return true;
        });
    }

    // async searchLogs(query: LogSearchQuery): Promise<ILog[]> {
    //     const logs = await this.readLogs();
    //
    //     return logs.filter((log) => {
    //         if (query.level && log.level !== query.level) {
    //             return false;
    //         }
    //
    //         if (query.message && !log.message.toLowerCase().includes(query.message.toLowerCase())) {
    //             return false;
    //         }
    //
    //         if (query.from !== undefined && (log.receivedTimestamp ?? 0) < query.from) {
    //             return false;
    //         }
    //
    //         if (query.to !== undefined && (log.receivedTimestamp ?? 0) > query.to) {
    //             return false;
    //         }
    //
    //         return true;
    //     });
    // }
}