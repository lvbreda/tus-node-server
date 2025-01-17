import { Upload } from './Upload';
export declare function validateKey(key: string): boolean;
export declare function validateValue(value: string): boolean;
export declare function parse(str?: string): Record<string, string | null> | undefined;
export declare function stringify(metadata: NonNullable<Upload['metadata']>): string;
