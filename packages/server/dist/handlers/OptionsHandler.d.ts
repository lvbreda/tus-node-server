/// <reference types="node" />
import { BaseHandler } from './BaseHandler';
import type http from 'node:http';
export declare class OptionsHandler extends BaseHandler {
    send(_: http.IncomingMessage, res: http.ServerResponse): Promise<http.ServerResponse<http.IncomingMessage>>;
}
