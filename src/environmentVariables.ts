import * as os from 'os';
import * as util from 'util';

const inspect = util.inspect.custom;
const envProperty = Symbol('envProperty');

export type EnvironmentVariablesBasic = Record<string, string>;
export type EnvironmentVariablesNull = Record<string, string | null>;
export type EnvironmentVariablesUndefined = NodeJS.ProcessEnv;
export type EnvironmentVariables = Record<string, string | null | undefined>;
export type EnvironmentVariablesItem = EnvironmentVariables | null | undefined;

class EnvironmentVariablesPrivate {
    private keyMapping: Map<string, string>;
    public [envProperty]: EnvironmentVariables;
    protected isWin32: boolean;
    protected preserveNull: boolean;
    constructor(
        preserveNull: boolean | undefined,
        isWin32: boolean | undefined) {
        this.keyMapping = new Map<string, string>();
        this[envProperty] = {};
        if (preserveNull === undefined) {
            this.preserveNull = false;
        } else {
            this.preserveNull = preserveNull;
        }
        if (isWin32 === undefined) {
            this.isWin32 = os.platform() === 'win32';
        } else {
            this.isWin32 = isWin32;
        }
    }

    private getKey(key: string): string {
        if (this.isWin32) {
            const normalizedKey = key.toUpperCase();
            let resultKey = this.keyMapping.get(normalizedKey);
            if (resultKey === undefined) {
                resultKey = key;
                this.keyMapping.set(normalizedKey, resultKey);
            }
            return resultKey;
        }
        return key;
    }

    public get(key: string | symbol): string | undefined | null {
        if (typeof key === 'string') {
            return this[envProperty][this.getKey(key)];
        }
        return undefined;
    }

    public set(key: string | symbol, value?: string | null, receiver?: any): boolean {
        if (typeof key === 'string') {
            let needSet = true;
            if (value === undefined) {
                needSet = false;
            } else if (value === null) {
                if (!this.preserveNull) {
                    needSet = false;
                }
            } else if (typeof value !== 'string') {
                value = '' + value;
            }
            if (needSet) {
                const existKey = this.getKey(key);
                return Reflect.set(this[envProperty], existKey, value, receiver);
            } else {
                return Reflect.deleteProperty(this[envProperty], key);
            }
        }
        return false;
    }

    [inspect]() {
        return util.inspect(this[envProperty]);
    }

    toString() {
        return this[envProperty].toString();
    }
}

export class EnvironmentVariablesUtils {

    public static create(from?: Map<string, string> | EnvironmentVariables | null, preserveNull?: boolean, isWin32?: boolean): EnvironmentVariablesUndefined {
        const env = new EnvironmentVariablesPrivate(preserveNull, isWin32);
        const p = new Proxy(env, {
            defineProperty: (target, p, attributes) => Reflect.defineProperty(target[envProperty], p, attributes),
            deleteProperty: (target, p) => Reflect.deleteProperty(target[envProperty], p),
            get: (target, p) => {
                if (typeof p === 'string') {
                    return target.get(p);
                }
                return Reflect.get(target, p);
            },
            getOwnPropertyDescriptor: (target, p) => {
                if (typeof p === 'string') {
                    return Reflect.getOwnPropertyDescriptor(target[envProperty], p);
                } else {
                    return Reflect.getOwnPropertyDescriptor(target, p);
                }
            }
            ,
            has: (target, p) => Reflect.has(target[envProperty], p),
            ownKeys: (target) => Reflect.ownKeys(target[envProperty]),
            set: (target, p, value, receiver): boolean => target.set(p, value, receiver)
        }) as unknown as EnvironmentVariablesUndefined;
        if (from !== undefined && from !== null) {
            if (from instanceof Map) {
                for (const [key, value] of from.entries()) {
                    p[key] = value;
                }
            } else {
                Object.assign(p, from);
            }
        }
        return p;
    }

    public static createPreserveNull(from?: Map<string, string> | EnvironmentVariables | null): EnvironmentVariables {
        return EnvironmentVariablesUtils.create(from, true);
    }

    public static mergeImpl(preserveNull: boolean, isWin32: boolean | undefined, ...envs: EnvironmentVariablesItem[]): EnvironmentVariablesUndefined {
        const newEnv = EnvironmentVariablesUtils.create(undefined, preserveNull, isWin32);
        for (const env of envs) {
            if (env !== undefined && env !== null) {
                Object.assign(newEnv, env);
            }
        }
        return newEnv;
    }

    public static merge(...envs: EnvironmentVariablesItem[]): EnvironmentVariablesUndefined {
        return EnvironmentVariablesUtils.mergeImpl(false, undefined, ...envs);
    }

    public static mergePreserveNull(...envs: EnvironmentVariablesItem[]): EnvironmentVariables {
        return EnvironmentVariablesUtils.mergeImpl(true, undefined, ...envs);
    }
}

function testEnvironment() {
    const envA = {
        A: 'x',
        B: null
    };
    const envB = {
        a: 'T',
        u: 'BBQ'
    };
    const resultA = EnvironmentVariablesUtils.mergeImpl(false, false, envA, undefined, envB);
    console.log(resultA);
    const resultB = EnvironmentVariablesUtils.mergeImpl(true, false, envA, undefined, envB);
    console.log(resultB);
    const resultC = EnvironmentVariablesUtils.mergeImpl(false, true, envA, undefined, envB);
    console.log(resultC);
    const resultD = EnvironmentVariablesUtils.mergeImpl(true, true, envA, undefined, envB);
    console.log(resultD);

    console.log(Object.keys(resultD));

    const m = new Map<string, string>();
    m.set('DD', 'FF');
    m.set('dd', 'FE');
    const resultE = EnvironmentVariablesUtils.create(m, false, false);
    console.log(resultE);

    const resultF = EnvironmentVariablesUtils.create(m, false, true);
    console.log(resultF);

    console.log('' + resultD);

    const localeOverrideA = EnvironmentVariablesUtils.create({
        LANG: "C",
        LC_ALL: "C",
        lc_all: "C"
    }, false, false);
    console.log(localeOverrideA);

    const localeOverrideB = EnvironmentVariablesUtils.create({
        LANG: "C",
        LC_ALL: "C",
        lc_all: "GBK"
    }, false, true);
    console.log(localeOverrideB);
    // console.log(process.env);
    // console.log('' + process.env);
}
testEnvironment();
