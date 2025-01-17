/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import fs from 'node:fs';
import stream from 'node:stream';
import http from 'node:http';
import { DataStore, Upload } from '@tus/server';
type Store = {
    get(key: string): Upload | undefined;
    set(key: string, value: Upload): void;
    delete(key: string): void;
    all: Record<string, Upload>;
};
type Options = {
    directory: string;
    configstore?: Store;
    expirationPeriodInMilliseconds?: number;
};
export declare class FileStore extends DataStore {
    directory: string;
    configstore: Store;
    expirationPeriodInMilliseconds: number;
    constructor({ directory, configstore, expirationPeriodInMilliseconds }: Options);
    /**
     *  Ensure the directory exists.
     */
    private checkOrCreateDirectory;
    /**
     * Create an empty file.
     */
    create(file: Upload): Promise<Upload>;
    read(file_id: string): fs.ReadStream;
    remove(file_id: string): Promise<void>;
    write(readable: http.IncomingMessage | stream.Readable, file_id: string, offset: number): Promise<number>;
    getUpload(id: string): Promise<Upload>;
    declareUploadLength(id: string, upload_length: number): Promise<void>;
    deleteExpired(): Promise<number>;
    getExpiration(): number;
}
export {};
