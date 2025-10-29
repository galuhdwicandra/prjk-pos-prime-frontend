export function toastSuccess(message: string): void {
    console.log('[SUCCESS]', message);
}

export function toastError(message: string): void {
    console.error('[ERROR]', message);
}
