import "dotenv/config";
export const env = {
    LOG_SERVER_PORT: Number(process.env.LOG_SERVER_PORT ?? 8080),
    LOG_SERVER_HOST: process.env.LOG_SERVER_HOST ?? "0.0.0.0",

    WRITER_SERVER_PORT: Number(process.env.WRITER_SERVER_PORT ?? 8090),
    WRITER_SERVER_HOST: process.env.WRITER_SERVER_HOST ?? "0.0.0.0",

    WRITER_SERVER_URL: process.env.WRITER_SERVER_URL ?? "ws://localhost:8090",

    LOG_FILE_PATH: process.env.LOG_FILE_PATH ?? "./logs/app.log",
    LOG_MAX_SIZE: Number(process.env.LOG_MAX_SIZE ?? 1024 * 1024),
} as const;