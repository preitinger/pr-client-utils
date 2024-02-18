import { useEffect, useRef, useState } from "react";

export type UseTardyTimeoutKey  = 'setToVisible' |
    'minVisible' |
    'unsetToInvisible' |
    'minInvisible'

export type UseTardyDelays = {
    setToVisible: number;
    minVisible: number;
    unsetToInvisible: number;
    minInvisible: number;
}

type TimeoutMap2 = {
    [K in keyof UseTardyDelays]?: NodeJS.Timeout
}

type InternState = 'invisible long' |
    'set short invisible long' |
    'visible short' |
    'visible long' |
    'unset short visible short' |
    'unset short visible long' |
    'unset long visible short' |
    'invisible short' |
    'set short invisible short' |
    'set long invisible short';

type TimeoutMap = Map<UseTardyTimeoutKey, NodeJS.Timeout>;

type InternData = {
    state: InternState;
    // timeouts: TimeoutMap;
    timeouts: TimeoutMap2;
}

export type UseTardyTimeoutDelayMap = Map<UseTardyTimeoutKey, number>;

export interface UseTardyFlagProps {
    initialValue: boolean;
    // timeoutDelays: UseTardyTimeoutDelayMap;
    timeoutDelays: UseTardyDelays
}

export type UseTardyFlagDebugResults = {
    internState: string;
}

export type UseTardyFlagResult = {
    value: boolean;
    set(value: boolean): void;

    debugResults: () => UseTardyFlagDebugResults;
}

export default function useTardyFlag(props: UseTardyFlagProps): [result:UseTardyFlagResult, set:(value:boolean) => void] {
    const [flag, setFlag] = useState<boolean>(props.initialValue);
    const data = useRef<InternData | null>(null)

    // const [internState, setInternState] = useState<string>('<unknown>');
    const internState = useRef<string>(getData().state);
    function setInternState(s: string) {
        internState.current = s;
    }

    function getData(): InternData {
        if (data.current == null) data.current = {
            state: 'invisible long',
            // timeouts: new Map<UseTardyTimeoutKey, NodeJS.Timeout>()
            timeouts: {}
        }

        return data.current;
    }

    const onTimeout = (key: UseTardyTimeoutKey) => () => {
        const data = getData();
        // console.log('onTimeout(', key, ') in state', data.state)
        // data.timeouts.delete(key);
        delete data.timeouts[key]

        switch (data.state) {
            case 'set short invisible long':
                switch (key) {
                    case 'setToVisible':
                        setMyTimeout('minVisible');
                        setFlag(true);
                        data.state = 'visible short';
                        setInternState(data.state);
                        break;
                }
                break;

            case 'visible short':
                switch (key) {
                    case 'minVisible':
                        // console.log('entering visible long')
                        data.state = 'visible long';
                        setInternState(data.state);
                        break;
                }
                break;

            case 'unset short visible short':
                switch (key) {
                    case 'minVisible':
                        data.state = 'unset short visible long';
                        setInternState(data.state);
                        break;

                    case 'unsetToInvisible':
                        data.state = 'unset long visible short';
                        setInternState(data.state);
                        break;
                }
                break;

            case 'unset short visible long':
                switch (key) {
                    case 'unsetToInvisible':
                        setMyTimeout('minInvisible');
                        setFlag(false);
                        data.state = 'invisible short';
                        setInternState(data.state);
                        break;
                }
                break;

            case 'unset long visible short':
                switch (key) {
                    case 'minVisible':
                        setMyTimeout('minInvisible');
                        setFlag(false);
                        data.state = 'invisible short';
                        setInternState(data.state);
                        break;
                }
                break;

            case 'invisible short':
                switch (key) {
                    case 'minInvisible':
                        data.state = 'invisible long';
                        setInternState(data.state);
                        break;
                }
                break;

            case 'set short invisible short':
                switch (key) {
                    case 'minInvisible':
                        data.state = 'set short invisible long';
                        setInternState(data.state);
                        break;
                    case 'setToVisible':
                        data.state = 'set long invisible short';
                        setInternState(data.state);
                        break;
                }
                break;

            case 'set long invisible short':
                switch (key) {
                    case 'minInvisible':
                        setMyTimeout('minVisible');
                        data.state = 'visible short';
                        setFlag(true);
                        setInternState(data.state);
                        break;
                }
                break;

        }
    }


    function setMyTimeout(key: UseTardyTimeoutKey): void {
        const data = getData();
        // data.timeouts.set(key, setTimeout(onTimeout(key), props.timeoutDelays.get(key)));
        data.timeouts[key] = setTimeout(onTimeout(key), props.timeoutDelays[key])
        // console.log('Did set timeout for key ', key);
    }

    function clearMyTimeout(key: UseTardyTimeoutKey): void {
        const data = getData();
        // const to = data.timeouts.get(key);
        const to = data.timeouts[key];
        if (to != null) {
            clearTimeout(to);
            // data.timeouts.delete(key);
            delete data.timeouts[key];
        } else {
            throw new Error('to was null');
        }
    }

    function jBackToVisibleShort(data: InternData) {
        clearMyTimeout('unsetToInvisible');
        data.state = 'visible short';
        setInternState(data.state);
    }

    function set(flag: boolean) {
        const data = getData();
        switch (data.state) {
            case 'invisible long':
                if (flag) {
                    setMyTimeout('setToVisible');
                    data.state = 'set short invisible long';
                    setInternState(data.state);
                }
                break;

            case 'set short invisible long':
                if (!flag) {
                    clearMyTimeout('setToVisible');
                    data.state = 'invisible long';
                    setInternState(data.state);
                }
                break;

            case 'visible short':
                if (!flag) {
                    setMyTimeout('unsetToInvisible');
                    data.state = 'unset short visible short';
                    setInternState(data.state);
                }
                break;

            case 'visible long':
                if (!flag) {
                    setMyTimeout('unsetToInvisible');
                    data.state = 'unset short visible long';
                    setInternState(data.state);
                }
                break;

            case 'unset short visible short':
                if (flag) {
                    jBackToVisibleShort(data);
                }
                break;

            case 'unset short visible long':
                if (flag) {
                    clearMyTimeout('unsetToInvisible');
                    data.state = 'visible long';
                    setInternState(data.state);
                }
                break;

            case 'unset long visible short':
                if (flag) {
                    data.state = 'visible short';
                    setInternState(data.state);
                }
                break;

            case 'invisible short':
                if (flag) {
                    setMyTimeout('setToVisible');
                    data.state = 'set short invisible short';
                    setInternState(data.state);
                }
                break;

            case 'set short invisible short':
                if (!flag) {
                    clearMyTimeout('setToVisible');
                    data.state = 'invisible short';
                    setInternState(data.state);
                }
                break;
        }
    }    
    return [
        {
        value: flag,
        debugResults: () => {
            // console.log('debugResults()', internState.current);

            return {
                internState: internState.current,
            }
        },
        set
    },
    set
]
}