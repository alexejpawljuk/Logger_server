export type ValidationError = {
    code: string;
    message: string;
};

export type ValidationSuccess<T> = {
    isValid: true;
    data: T;
};

export type ValidationFailure = {
    isValid: false;
    error: ValidationError;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface IValidator<T> {
    validate(params: unknown): ValidationResult<T>;
}