export declare class Pathkeeper {
    private basePath;
    private filePath;
    private sameStringMode;
    constructor(basePath: string, filePath: string, sameStringMode?: boolean);
    rel(): string;
    abs(): string;
    toString(): string;
    valueOf(): string;
    length(): number;
}
