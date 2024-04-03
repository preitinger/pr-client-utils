/**
 * 
 * @param target the event target to which the listener will be added and from which the returned function will remove the listener for cleanup
 * @param eventName 
 * @param listener 
 * @param options
 * @returns a function for releasing that will remove the event listener that is added in the call of myAddEventListener()
 */
export function myAddEventListener<E extends Event>(target:EventTarget, eventName: string, listener: (e: E) => void, options?: boolean | AddEventListenerOptions | undefined) {
    target.addEventListener(eventName, listener as EventListener, options);
    return () => {
        target.removeEventListener(eventName, listener as EventListener, options);
    }
}
