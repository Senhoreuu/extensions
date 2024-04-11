export function emitEvent(event, value) {
    const eventObj = new CustomEvent(event, {
        detail: value
    });

    document.dispatchEvent(eventObj);
}

export function receiveEvent(event, callback, options = { once: false }) {
    const { once } = options;

    document.addEventListener(event, callback, {
        once
    });
}