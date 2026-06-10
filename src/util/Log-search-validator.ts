import { LOG_LEVEL } from "../constants/log-level";
import { TIMESTAMP_FIELD } from "../constants/timestamp-fields";
import { IValidator, ValidationResult } from "../types/validator";
import { LogLevel, LogSearchQuery, LogTimestampField } from "../types/log";
import { ERROR_CODE } from "../constants/error-codes";

export class LogSearchValidator implements IValidator<LogSearchQuery> {
    validate(params: unknown): ValidationResult<LogSearchQuery> {
        if (!params || typeof params !== "object") {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_SEARCH_PARAMS,
                    message: "Search params must be an object",
                },
            };
        }

        const input = params as Partial<LogSearchQuery>;

        if (
            input.level !== undefined &&
            (
                typeof input.level !== "string" ||
                !Object.values(LOG_LEVEL).includes(input.level as LogLevel)
            )
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_SEARCH_LEVEL,
                    message: "Field 'level' contains unsupported log level",
                },
            };
        }

        if (
            input.message !== undefined &&
            typeof input.message !== "string"
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_SEARCH_MESSAGE,
                    message: "Field 'message' must be a string",
                },
            };
        }

        if (
            input.from !== undefined &&
            (
                typeof input.from !== "number" ||
                !Number.isFinite(input.from) ||
                input.from <= 0
            )
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_SEARCH_FROM,
                    message: "Field 'from' must be a positive number",
                },
            };
        }

        if (
            input.to !== undefined &&
            (
                typeof input.to !== "number" ||
                !Number.isFinite(input.to) ||
                input.to <= 0
            )
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_SEARCH_TO,
                    message: "Field 'to' must be a positive number",
                },
            };
        }

        if (
            input.from !== undefined &&
            input.to !== undefined &&
            input.from > input.to
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_SEARCH_RANGE,
                    message: "Field 'from' must be less than or equal to field 'to'",
                },
            };
        }

        if (
            input.timestampField !== undefined &&
            (
                typeof input.timestampField !== "string" ||
                !Object.values(TIMESTAMP_FIELD).includes(input.timestampField as LogTimestampField)
            )
        ) {
            return {
                isValid: false,
                error: {
                    code: ERROR_CODE.INVALID_SEARCH_TIMESTAMP_FIELD,
                    message: "Field 'timestampField' contains unsupported timestamp field",
                },
            };
        }

        const query: LogSearchQuery = {};

        if (input.level !== undefined) {
            query.level = input.level;
        }

        if (input.message !== undefined) {
            query.message = input.message.trim();
        }

        if (input.from !== undefined) {
            query.from = input.from;
        }

        if (input.to !== undefined) {
            query.to = input.to;
        }

        if (input.timestampField !== undefined) {
            query.timestampField = input.timestampField;
        }

        return {
            isValid: true,
            data: query,
        };
    }
}