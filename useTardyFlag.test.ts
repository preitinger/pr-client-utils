import { act, renderHook } from "@testing-library/react";
import useTardyFlag, { UseTardyFlagProps, UseTardyFlagResult } from "./useTardyFlag";

jest.useFakeTimers();

describe('useTardyFlag filters the state of a flag according to some delays in milliseconds', () => {
    // let tardyFlag: 

    beforeEach(() => {

    })
    it('makes the value change from false to true <setToVisible>ms after a call of set()(true)', async () => {
        const props: UseTardyFlagProps = {
            initialValue: false,
            timeoutDelays: {
                setToVisible: 100,
                minVisible: 0,
                unsetToInvisible: 0,
                minInvisible: 0
            }
        }
        const tardyFlag = renderHook(() => useTardyFlag(props));
        const st = () => {
            return tardyFlag.result.current[0];
        }
        const set = () => {
            return tardyFlag.result.current[1];
        }

        expect(st().value).toBe(false);
        await act(async () => {
            set()(true)
            await jest.advanceTimersByTimeAsync(props.timeoutDelays.setToVisible - 1)
        })
        expect(st().value).toBe(false);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1);
        })
        expect(st().value).toBe(true);
    })
    it('does not change the value from false to true on set()(true) if set()(false) is called earlier than props.timeoutDelays.setToVisible ms after set()(true)', async () => {
        const props: UseTardyFlagProps = {
            initialValue: false,
            timeoutDelays: {
                setToVisible: 100,
                minVisible: 0,
                unsetToInvisible: 0,
                minInvisible: 0
            }
        }
        const tardyFlag = renderHook(() => useTardyFlag(props));
        const st = () => {
            return tardyFlag.result.current[0];
        }
        const set = () => {
            return tardyFlag.result.current[1];
        }
        expect(st().value).toBe(false);
        await act(async () => {
            set()(true)
            await jest.advanceTimersByTimeAsync(props.timeoutDelays.setToVisible - 1)
        })
        expect(st().value).toBe(false);
        await act(async () => {
            set()(false);
        })

        expect(st().value).toBe(false);

        for (let i = 0; i < 20; ++i) {
            await act(async () => {
                await jest.advanceTimersByTimeAsync(1);
            })
            expect(st().value).toBe(false);
        }
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1000);
        })
        expect(st().value).toBe(false);

    })

    it('makes the value to stay true for at least props.timeoutDelays.minVisible ms. Only then, the value is changed to false on a call to set()(false) if props.timeoutDelays.minVisible >= props.timeoutDelays.unsetToInvisible, ', async () => {
        const props: UseTardyFlagProps = {
            initialValue: false,
            timeoutDelays: {
                setToVisible: 0,
                minVisible: 100,
                unsetToInvisible: 0,
                minInvisible: 0
            }
        }
        const tardyFlag = renderHook(() => useTardyFlag(props));
        const st = () => {
            return tardyFlag.result.current[0];
        }
        const set = () => {
            return tardyFlag.result.current[1];
        }
        await act(async () => {
            set()(true);
            jest.advanceTimersByTime(0);
        })
        expect(st().value).toBe(true);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1);
            set()(false);
        })

        for (let i = 2; i < props.timeoutDelays.minVisible; ++i) {
            await act(async () => {
                await jest.advanceTimersByTimeAsync(1);
            })
            expect(st().value).toBe(true);
        }
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1);
        })
        expect(st().value).toBe(false);
    })

    it('when set()(true) is called at time t and value has become true at time (t + setToVisible) and set()(false) is called at time (t + setToVisible + d1) and \n\
        0 <= d1 <= minVisible and d1 + unsetToInvisible >= minVisible, \n\
        then value becomes false at time (t + setToVisible + d1 + unsetToInvisible', async () => {

        const t = 10;
        const setToVisible = 10;
        const d1 = 5;
        const minVisible = 10;
        const unsetToInvisible = minVisible - d1 + 2;
        expect(0 <= d1).toBe(true);
        expect(d1 <= minVisible).toBe(true);
        expect(d1 + unsetToInvisible).toBeGreaterThanOrEqual(minVisible);
        const props: UseTardyFlagProps = {
            initialValue: false,
            timeoutDelays: {
                setToVisible: setToVisible,
                minVisible: minVisible,
                unsetToInvisible: unsetToInvisible,
                minInvisible: 0
            }
        }
        const tardyFlag = renderHook(() => useTardyFlag(props));
        const st = () => {
            return tardyFlag.result.current[0];
        }
        const set = () => {
            return tardyFlag.result.current[1];
        }
        await act(async () => {
            await jest.advanceTimersByTimeAsync(t);
            set()(true);
            await jest.advanceTimersByTimeAsync(setToVisible - 1);
        })
        // { at time (t + setToVisible-1) }
        expect(st().value).toBe(false);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1);
        })
        // { at time (t + setToVisible) }
        expect(st().value).toBe(true);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(d1);
            set()(false);
        })
        // { at time (t + setToVisible + d1) }
        expect(st().value).toBe(true);

        await act(async () => {
            await jest.advanceTimersByTimeAsync(unsetToInvisible - 1);
        })
        // { at time (t + setToVisible + d1 + unsetToInvisible - 1) }
        expect(st().value).toBe(true);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1);
        })
        // { at time (t + setToVisible + d1 + unsetToInvisible) }
        expect(st().value).toBe(false);
    })

    it('when set()(true) is called at time t and value has become true at time (t + setToVisible) and set()(false) is called at time (t + setToVisible + d1) and \n\
        0 <= d1 <= minVisible and d1 + unsetToInvisible < minVisible, \n\
        then value becomes false at time (t + setToVisible + minVisible', async () => {


        // 
        const t = 10;
        const setToVisible = 10;
        const d1 = 5;
        const minVisible = 100;
        const unsetToInvisible = 10;
        const minInvisible = 0;
        expect(0 <= d1).toBe(true);
        expect(d1 <= minVisible).toBe(true);
        expect(d1 + unsetToInvisible).toBeLessThan(minVisible);
        const props: UseTardyFlagProps = {
            initialValue: false,
            timeoutDelays: {
                setToVisible: setToVisible,
                minVisible: minVisible,
                unsetToInvisible: unsetToInvisible,
                minInvisible: minInvisible
            }
        }
        const tardyFlag = renderHook(() => useTardyFlag(props));
        const st = () => {
            return tardyFlag.result.current[0];
        }
        const set = () => {
            return tardyFlag.result.current[1];
        }
        await act(async () => {
            await jest.advanceTimersByTimeAsync(t);
            set()(true);
            await jest.advanceTimersByTimeAsync(setToVisible - 1);
        })
        // { at time (t + setToVisible-1) }
        expect(st().value).toBe(false);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1);
        })
        // { at time (t + setToVisible) }
        expect(tardyFlag.result.current[0].value).toBe(true);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(d1);
            set()(false);
        })
        // { at time (t + setToVisible + d1) }
        expect(st().value).toBe(true);

        await act(async () => {
            await jest.advanceTimersByTimeAsync(minVisible - 1 - d1);
        })
        // { at time (t + setToVisible + minVisible - 1) }
        expect(st().value).toBe(true);
        await act(async () => {
            await jest.advanceTimersByTimeAsync(1);
        })
        // { at time (t + setToVisible + minVisible) }
        expect(st().value).toBe(false);


    });

    describe('test each state machine transition', () => {
        async function state(props: UseTardyFlagProps, result: UseTardyFlagResult, destState: string) {
            function go(s: string) {
                return state(props, result, s);
            }
            function adv(ms: number) {
                return jest.advanceTimersByTimeAsync(ms);
            }
            switch (destState) {
                case 'invisible long':
                    return;
                    break;
                case 'set short invisible long':
                    await go('invisible long');
                    result.set(true);
                    break;
                case 'visible short':
                    await go('set short invisible long');
                    await adv(props.timeoutDelays.setToVisible);
                    break;
                case 'visible long':
                    await go('visible short');
                    await adv(props.timeoutDelays.minVisible);
                    break;
                case 'unset short visible short':
                    await go('visible short');
                    result.set(false);
                    break;
                case 'unset short visible long':
                    await go('visible long');
                    result.set(false);
                    break;
                case 'unset long visible short':
                    expect(props.timeoutDelays.unsetToInvisible).toBeLessThan(props.timeoutDelays.minVisible);
                    await go('unset short visible short');
                    await adv(props.timeoutDelays.unsetToInvisible);
                    break;
                case 'invisible short':
                    await go('visible long');
                    result.set(false);
                    await adv(props.timeoutDelays.unsetToInvisible);
                    break;
                case 'set short invisible short':
                    await go('invisible short');
                    result.set(true);
                    break;
                case 'set long invisible short':
                    console.log('here', props.timeoutDelays);
                    expect(props.timeoutDelays.setToVisible).toBeLessThan(props.timeoutDelays.minInvisible);
                    await go('set short invisible short');
                    await adv(props.timeoutDelays.setToVisible);
                    break;
                default:
                    throw new Error('Unexpected destState ' + destState);
            }
        }

        test('helper function state', async () => {
            // const t = 10;
            const setToVisible = 10;
            const d1 = 5;
            const minVisible = 100;
            const unsetToInvisible = 10;
            const minInvisible = 0;
            expect(0 <= d1).toBe(true);
            expect(d1 <= minVisible).toBe(true);
            expect(d1 + unsetToInvisible).toBeLessThan(minVisible);
            const props1: UseTardyFlagProps = {
                initialValue: false,
                timeoutDelays: {
                    setToVisible: setToVisible,
                    minVisible: minVisible,
                    unsetToInvisible: unsetToInvisible,
                    minInvisible: minInvisible
                }
            }

            const states1 = [
                'invisible long',
                'set short invisible long',
                'visible short',
                'visible long',
                'unset short visible short',
                'unset short visible long',
                'unset long visible short',
                'invisible short',
                'set short invisible short',
                // 'set long invisible short',
            ];

            const states2 = [
                // 'invisible long',
                // 'set short invisible long',
                // 'visible short',
                // 'visible long',
                // 'unset short visible short',
                // 'unset short visible long',
                // 'unset long visible short',
                // 'invisible short',
                // 'set short invisible short',
                'set long invisible short',
            ];

            const props2: UseTardyFlagProps = {
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 10,
                    minVisible: 100,
                    unsetToInvisible: 10,
                    minInvisible: 100
                }
            }

            const combinations = [
                {
                    states: states1,
                    props: props1
                },
                {
                    states: states2,
                    props: props2
                }
            ]

            for (const combination of combinations) {
                const props = combination.props;
                for (const destState of combination.states) {
                    const tardyFlag = renderHook(() => useTardyFlag(props));
                    const st = () => {
                        return tardyFlag.result.current[0];
                    }
                    // const set = () => {
                    //     return tardyFlag.result.current[1];
                    // }
                    await act(async () => {
                        await state(props, st(), destState)
                    })
                    expect(st().debugResults().internState).toBe(destState);
                }
            }
        })

        test('invisible long -> set short invisible long', async () => {
            // const t = 10;
            const setToVisible = 10;
            const d1 = 5;
            const minVisible = 100;
            const unsetToInvisible = 10;
            const minInvisible = 0;
            expect(0 <= d1).toBe(true);
            expect(d1 <= minVisible).toBe(true);
            expect(d1 + unsetToInvisible).toBeLessThan(minVisible);
            const props: UseTardyFlagProps = {
                initialValue: false,
                timeoutDelays: {
                    setToVisible: setToVisible,
                    minVisible: minVisible,
                    unsetToInvisible: unsetToInvisible,
                    minInvisible: minInvisible
                }
            }
            const tardyFlag = renderHook(() => useTardyFlag(props));
            const st = () => {
                return tardyFlag.result.current[0];
            }
            const set = () => {
                return tardyFlag.result.current[1];
            }
            await act(async () => {
                await jest.advanceTimersByTimeAsync(2);
            })
            expect(st().debugResults().internState).toBe('invisible long');
            expect(st().value).toBe(false);
            await act(async () => {
                set()(true);
                await jest.advanceTimersByTimeAsync(setToVisible - 1);
            })
            expect(st().debugResults().internState).toBe('set short invisible long');
            expect(st().value).toBe(false);
            await act(async () => {
                await jest.advanceTimersByTimeAsync(1);
            })
            expect(st().debugResults().internState).toBe('visible short');
            expect(st().value).toBe(true);
        })

        test('set short invisible long -> visible short', async () => {
            // const t = 10;
            const setToVisible = 10;
            const d1 = 5;
            const minVisible = 100;
            const unsetToInvisible = 10;
            const minInvisible = 0;
            expect(0 <= d1).toBe(true);
            expect(d1 <= minVisible).toBe(true);
            expect(d1 + unsetToInvisible).toBeLessThan(minVisible);
            const props: UseTardyFlagProps = {
                initialValue: false,
                timeoutDelays: {
                    setToVisible: setToVisible,
                    minVisible: minVisible,
                    unsetToInvisible: unsetToInvisible,
                    minInvisible: minInvisible
                }
            }
            const tardyFlag = renderHook(() => useTardyFlag(props));
            const st = () => {
                return tardyFlag.result.current[0];
            }
            const set = () => {
                return tardyFlag.result.current[1];
            }
            await act(async () => {
                await jest.advanceTimersByTimeAsync(2);
            })
            expect(st().debugResults().internState).toBe('invisible long');
            expect(st().value).toBe(false);
            await act(async () => {
                set()(true);
                await jest.advanceTimersByTimeAsync(setToVisible - 1);
            })
            expect(st().debugResults().internState).toBe('set short invisible long');
            expect(st().value).toBe(false);
            await act(async () => {
                await jest.advanceTimersByTimeAsync(1);
            })
            expect(st().debugResults().internState).toBe('visible short');
            expect(st().value).toBe(true);
        })

        test('set short invisible long -> invisible long', async () => {
            // const t = 10;
            const setToVisible = 10;
            const d1 = 5;
            const minVisible = 100;
            const unsetToInvisible = 10;
            const minInvisible = 0;
            expect(0 <= d1).toBe(true);
            expect(d1 <= minVisible).toBe(true);
            expect(d1 + unsetToInvisible).toBeLessThan(minVisible);
            const props: UseTardyFlagProps = {
                initialValue: false,
                timeoutDelays: {
                    setToVisible: setToVisible,
                    minVisible: minVisible,
                    unsetToInvisible: unsetToInvisible,
                    minInvisible: minInvisible
                }
            }
            const tardyFlag = renderHook(() => useTardyFlag(props));
            const st = () => {
                return tardyFlag.result.current[0];
            }
            const set = () => {
                return tardyFlag.result.current[1];
            }
            await act(async () => {
                await state(props, st(), 'set short invisible long');
            })
            expect(st().debugResults().internState).toBe('set short invisible long');
            await act(async () => {
                set()(false);
            })
            expect(st().debugResults().internState).toBe('invisible long');
        })

        async function genericTransitionTest(props: UseTardyFlagProps, sourceState: string, actions: (result: UseTardyFlagResult) => Promise<void>, expectedDestState: string, expectedDestValue: boolean) {
            const tardyFlag = renderHook(() => useTardyFlag(props));
            const st = () => {
                return tardyFlag.result.current[0];
            }
            // const set = () => {
            //     return tardyFlag.result.current[1];
            // }
            act(() => {

            })
            await act(async () => {
                await state(props, st(), sourceState);
            });
            expect(st().debugResults().internState).toBe(sourceState);
            await act(async () => {
                await actions(st())
            })
            expect(st().debugResults().internState).toBe(expectedDestState);
            expect(st().value).toBe(expectedDestValue);
        }

        test('[alternative] set short invisible long -> invisible long', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 100,
                    unsetToInvisible: 100,
                    minInvisible: 100
                }
            }, 'set short invisible long', async (result) => {
                result.set(false);
            }, 'invisible long',
                false)
        })

        test('visible long -> unset short visible long', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 100,
                    unsetToInvisible: 100,
                    minInvisible: 100
                }
            }, 'visible long',
                async (result) => {
                    result.set(false);
                }, 'unset short visible long',
                true)
        })

        test('unset short visible long -> visible long', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 100,
                    unsetToInvisible: 100,
                    minInvisible: 100
                }
            }, 'unset short visible long',
                async (result) => {
                    result.set(true);
                }, 'visible long', true)

        })

        test('visible short -> unset short visible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 100,
                    unsetToInvisible: 100,
                    minInvisible: 100
                }
            }, 'visible short',
                async (result) => {
                    result.set(false);
                }, 'unset short visible short', true)
        })

        test('unset short visible short -> unset short visible long', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 100,
                    unsetToInvisible: 200,
                    minInvisible: 100
                }
            }, 'unset short visible short',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(100)
                }, 'unset short visible long', true)
        })

        test('unset short visible short -> unset long visible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 100,
                    minInvisible: 100
                }
            }, 'unset short visible short',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(100)
                }, 'unset long visible short', true)
        })

        test('unset short visible short -> visible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 100,
                    minInvisible: 100
                }
            }, 'unset short visible short',
                async (result) => {
                    result.set(true);
                }, 'visible short', true)
        })

        test('unset long visible short -> visible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 100
                }
            }, 'unset long visible short',
                async (result) => {
                    result.set(true);
                }, 'visible short', true)
        })

        test('unset short visible long -> invisible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 100
                }
            }, 'unset short visible long',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(90);
                }, 'invisible short', false)
        })

        test('unset long visible short -> invisible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 100
                }
            }, 'unset long visible short',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(101 - 90);
                }, 'invisible short', false)
        })

        test('invisible short -> set short invisible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 100
                }
            }, 'invisible short',
                async (result) => {
                    result.set(true);
                }, 'set short invisible short', false)
        })

        test('set short invisible short -> invisible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 100
                }
            }, 'set short invisible short',
                async (result) => {
                    result.set(false);
                }, 'invisible short', false)
        })

        test('invisible short -> invisible long', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 100
                }
            }, 'invisible short',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(100);
                }, 'invisible long', false)
        })

        test('set short invisible short -> set short invisible long', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 1010,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 100
                }
            }, 'set short invisible short',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(100);
                }, 'set short invisible long', false)
        })

        test('set short invisible short -> set long invisible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 99,
                    minVisible: 101,
                    unsetToInvisible: 90,
                    minInvisible: 101
                }
            }, 'set short invisible short',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(99);
                }, 'set long invisible short', false)
        })
        test('set long invisible short -> visible short', () => {
            return genericTransitionTest({
                initialValue: false,
                timeoutDelays: {
                    setToVisible: 100,
                    minVisible: 110,
                    unsetToInvisible: 90,
                    minInvisible: 110
                }
            }, 'set long invisible short',
                async (/* result */) => {
                    await jest.advanceTimersByTimeAsync(110 - 100);
                }, 'visible short', true)
        })
        // test(' -> ', () => {
        //     return genericTransitionTest({
        //         initialValue: false,
        //         timeoutDelays: {
        //             setToVisible: 100,
        //             minVisible: 101,
        //             unsetToInvisible: 90,
        //             minInvisible: 100
        //         }
        //     }, '',
        //     async (result) => {

        //     }, '')
        // })


        // // kopieren!
        // test(' -> ', () => {
        //     return genericTransitionTest({
        //         initialValue: false,
        //         timeoutDelays: {
        //             setToVisible: 100,
        //             minVisible: 101,
        //             unsetToInvisible: 90,
        //             minInvisible: 100
        //         }
        //     }, '',
        //     async (result) => {

        //     }, '')
        // })



    })

})
