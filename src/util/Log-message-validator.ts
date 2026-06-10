import {ILog, LogLevel} from "../types/log";
import {LOG_LEVEL} from "../constants/log-level";
import {IValidator, ValidationResult} from "../types/validator";
import {ERROR_CODE} from "../constants/error-codes";


export class LogMessageValidator implements IValidator<ILog> {
    validate(params: unknown): ValidationResult<ILog> {
        if (!params || typeof params !== "object") {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_PARAMS,
                    message: "Params must be an object",
                },
            };
        }

        const input = params as Partial<ILog>;

        if (
            typeof input.eventTimestamp !== "number" ||
            !Number.isFinite(input.eventTimestamp) ||
            input.eventTimestamp <= 0
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_EVENT_TIMESTAMP,
                    message: "Field 'eventTimestamp' must be a positive number",
                },
            };
        }

        if (typeof input.message !== "string" || input.message.trim() === "") {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_MESSAGE,
                    message: "Field 'message' must be a non-empty string",
                },
            };
        }

        if (
            typeof input.level !== "string" ||
            !Object.values(LOG_LEVEL).includes(input.level as LogLevel)
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_LEVEL,
                    message: "Field 'level' contains unsupported log level",
                },
            };
        }

        return {
            isValid: true,
            data: {
                eventTimestamp: input.eventTimestamp,
                message: input.message.trim(),
                level: input.level as LogLevel,
            }
        };
    }
}