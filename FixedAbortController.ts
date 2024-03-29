export default class FixedAbortController extends AbortController {
    constructor() {
        super();
        this.signal.throwIfAborted = () => {
            if (this.signal.aborted) {
                // try {
                //     throw new Error('STACKTRACE')
                // } catch (reason) {
                //     console.warn(reason);
                // }
                // console.warn('throwIfAborted gonna throw', this.signal.reason);
                throw this.signal.reason
                
                // throw new Error('from throwIfAborted', {
                //     cause: this.signal.reason
                // })
                // throw FixedAbortController.REASON;
            }
        }
    }

    // static REASON: string = 'thrownBecauseAborted';
}