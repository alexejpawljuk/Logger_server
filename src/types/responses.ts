export type AppError = {
    code: string;
    message: string;
};

export type AppSuccess<T> = {
    success: true;
    data: T;
};

export type AppFailure = {
    success: false;
    error: AppError;
};

export type AppResponse<T> = AppSuccess<T> | AppFailure;