interface IStaticSingleton {
    create<T, C extends object[] = object[]>(...args: C): Promise<T>
    hasInstance(): boolean;
    _instance: Singleton;
    getInstance(): Singleton
}

abstract class Singleton {
    protected static _instance: Singleton;

    protected constructor() {        
        if (this._static().hasInstance()) {
            throw new Error('Use create() instead of new to instantiate');
        }
    }

    protected _static(){
        return (this.constructor as unknown) as IStaticSingleton;
    }

    protected static hasInstance(): boolean {
        return !!this._instance;
    }

    protected static getInstance(): Singleton {
        return this._instance;
    }

    public static create<T, C extends any[] = any[]>(...args: C): T {
        if (!this._instance) {
            this._instance = new (this as any)(...args);
        }

        this._instance.onCreate();

        return this._instance as T;
    }

    onCreate(): void {}
}

export default Singleton;