const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

function randomString(size) {
  return crypto.randomBytes(size).toString('base64url').slice(0, size);
}

class InMemoryStreamSplitter extends stream.EventEmitter {
  constructor(stream, maxSize) {
    super();

    this.buffer = [];
    this.stream = stream;
    this.maxSize = maxSize;

    this.partial = null;

    this.stream.on('error', this.handleError.bind(this));
    this.stream.on('data', this.handleData.bind(this));
    this.stream.on('end', this.handleEnd.bind(this));
  }

  handleError(err) {
    this.handleEnd();
  }

  handleEnd() {
    if (this.partial) {
      this.partial.stream.end();
      this.partial = null;
    }
  }

  handleData(data) {
    if (!this.partial) {
      this.partial = {
        stream: new stream.PassThrough(),
        bytes: 0,
      };
      this.emit('stream', this.partial.stream);
    }

    const overflow = this.partial.bytes + data.length - this.maxSize;
    if (overflow > 0) {
      this.handleData(data.splice(0, data.length - overflow));
      this.handleData(data.splice(data.length - overflow, data.length));
      return;
    }

    this.partial.bytes += data.length;
    this.partial.stream.write(data);

    if (overflow === 0) {
      this.partial.stream.end();
      this.partial = null;
    }
  }
}

class FileStreamSplitter extends stream.Writable {
  constructor(options, { maxChunkSize, directory }) {
    super(options);

    this.maxChunkSize = maxChunkSize;

    this.currentChunkPath = null;
    this.currentChunkSize = null;
    this.fd = null;

    this.directory = directory;
    this.filenameTemplate = randomString(10);

    this.part = 0;

    this.on('error', this._finishChunk.bind(this));

  }

  _write(chunk, encoding, callback) {
    Promise.resolve()
      .then(() => {
        if (this.fd === null) {
          return this._newChunk();
        }
      })
      .then(() => {
          const overflow =
          this.currentChunkSize + chunk.length - this.maxChunkSize;
        if (overflow > 0) {
          return this._writeChunk(chunk.slice(0, chunk.length - overflow))
            .then(this._finishChunk.bind(this))
            .then(this._newChunk.bind(this))
            .then(() => {
              return this._writeChunk(
                chunk.slice(chunk.length - overflow, chunk.length)
              );
            })
            .then(() => callback())
            .catch(callback);
        }

        return this._writeChunk(chunk)
          .then(() => callback())
          .catch(callback);
      })
      .catch(callback);
  }

  _final(callback) {
    if (this.fd === null) {
      return callback();
    }

    this._finishChunk()
      .then(() => callback())
      .catch(callback);
  }

  _writeChunk(chunk) {
    return new Promise((resolve, reject) => {
      fs.write(this.fd, chunk, (err) => {
        if (err) return reject(err);

        this.currentChunkSize += chunk.length;
        return resolve();
      });
    });
  }

  _finishChunk() {
    if (this.fd === null) 
        return Promise.resolve();

    return new Promise((resolve, reject) => {
      fs.close(this.fd, (err) => {
        if (err) return reject(err);

        this.emit('chunkFinished', this.currentChunkPath);

        this.currentChunkPath = null;
        this.fd = null;
        this.currentChunkSize = null;

        this.part += 1;

        return resolve();
      });
    });
  }

  _newChunk() {
    return new Promise((resolve, reject) => {
      this.currentChunkPath = path.join(this.directory, `${this.filenameTemplate}-${this.part}`)
      fs.open(this.currentChunkPath, 'w', (err, fd) => {
        if (err) return reject(err);

        this.emit('chunkStarted', this.currentChunkPath);

        this.currentChunkSize = 0;
        this.fd = fd;

        return resolve();
      });
    });
  }
}

module.exports = {
  FileStreamSplitter,
  InMemoryStreamSplitter,
};