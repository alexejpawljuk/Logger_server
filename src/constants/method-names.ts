export const METHOD_NAME = {
    LOG_MESSAGE: "logMessage",              // client -> LogServer
    GET_LOGS: "getLogs",                    // client -> LogServer
    SEARCH_LOGS: "searchLogs",              // client -> LogServer

    WRITE_LOG: "writeLog",                  // LogServer -> WriterServer
    READ_LOGS: "readLogs",                  // LogServer -> WriterServer
    SEARCH_STORED_LOGS: "searchStoredLogs"  // LogServer -> WriterServer
} as const;
