type EventCallback = (detail: any) => void;

export const graphEvents = {
    on: (event: string, callback: EventCallback) => {
        document.addEventListener(`graph:${event}`, (e: any) => callback(e.detail));
    },
    emit: (event: string, detail: any) => {
        document.dispatchEvent(new CustomEvent(`graph:${event}`, { detail }));
    },
    off: (event: string, callback: EventCallback) => {
        document.removeEventListener(`graph:${event}`, callback as any);
    }
};