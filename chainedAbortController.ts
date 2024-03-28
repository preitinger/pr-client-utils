import FixedAbortController from "./FixedAbortController";

/**
 * creates an instance of FixedAbortController which is aborted upon the given signal, but can also be aborted manually, of course.
 * @param signal the signal which makes the new AbortController abort
 */
export default function chainedAbortController(signal: AbortSignal): [abortController: FixedAbortController, release: () => void] {
    const abort = new FixedAbortController();
    function abortListener() {
        abort.abort();

    }
    signal.addEventListener('abort', abortListener, {
        once: true
    })
    console.log('abort listener added in chainedAbortController()')

    return [abort, () => {
        signal.removeEventListener('abort', abortListener)
        console.log('abort listener removed in relase of chainedAbortController');
    }];
}
