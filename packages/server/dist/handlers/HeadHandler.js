"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeadHandler = void 0;
const BaseHandler_1 = require("./BaseHandler");
const constants_1 = require("../constants");
const models_1 = require("../models");
class HeadHandler extends BaseHandler_1.BaseHandler {
    async send(req, res) {
        const id = this.getFileIdFromRequest(req);
        if (id === false) {
            throw constants_1.ERRORS.FILE_NOT_FOUND;
        }
        const file = await this.store.getUpload(id);
        // If a Client does attempt to resume an upload which has since
        // been removed by the Server, the Server SHOULD respond with the
        // with the 404 Not Found or 410 Gone status. The latter one SHOULD
        // be used if the Server is keeping track of expired uploads.
        const now = new Date();
        if (this.store.hasExtension('expiration') &&
            this.store.getExpiration() > 0 &&
            file.creation_date &&
            now > new Date(new Date(file.creation_date).getTime() + this.store.getExpiration())) {
            throw constants_1.ERRORS.FILE_NO_LONGER_EXISTS;
        }
        // The Server MUST prevent the client and/or proxies from
        // caching the response by adding the Cache-Control: no-store
        // header to the response.
        res.setHeader('Cache-Control', 'no-store');
        // The Server MUST always include the Upload-Offset header in
        // the response for a HEAD request, even if the offset is 0
        res.setHeader('Upload-Offset', file.offset);
        if (file.sizeIsDeferred) {
            // As long as the length of the upload is not known, the Server
            // MUST set Upload-Defer-Length: 1 in all responses to HEAD requests.
            res.setHeader('Upload-Defer-Length', '1');
        }
        else {
            // If the size of the upload is known, the Server MUST include
            // the Upload-Length header in the response.
            res.setHeader('Upload-Length', file.size);
        }
        if (file.metadata !== undefined) {
            // If the size of the upload is known, the Server MUST include
            // the Upload-Length header in the response.
            res.setHeader('Upload-Metadata', models_1.Metadata.stringify(file.metadata));
        }
        return res.end();
    }
}
exports.HeadHandler = HeadHandler;
