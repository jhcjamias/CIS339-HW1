const mongoose = require('mongoose');

// Error with an HTTP status and optional per-field messages for the client.
class HttpError extends Error {
    constructor(status, message, fields) {
        super(message);
        this.status = status;
        this.fields = fields;
    }
}

// Converts a Mongoose ValidationError into { field: message }.
// `rename` maps schema paths to API field names (e.g. studentId -> id).
function validationFields(error, rename = {}) {
    const fields = {};
    for (const [path, detail] of Object.entries(error.errors)) {
        fields[rename[path] ?? path] = detail.message;
    }
    return fields;
}

// Validates a new document and throws a 400 HttpError with field messages.
async function validateDocument(doc, rename) {
    try {
        await doc.validate();
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            throw new HttpError(400, 'Please correct the highlighted fields.', validationFields(error, rename));
        }
        throw error;
    }
}

// Express error-handling middleware: maps known errors to JSON responses.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (err instanceof HttpError) {
        const body = { error: err.message };
        if (err.fields) body.fields = err.fields;
        return res.status(err.status).json(body);
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    // Client errors raised by Express/middleware (e.g. a missing static asset).
    if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ error: err.expose ? err.message : 'Request could not be processed.' });
    }
    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: validationFields(err) });
    }
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ error: `Invalid value for ${err.path}.` });
    }
    if (err.code === 11000) {
        // Unique index violation (e.g. two simultaneous identical requests).
        return res.status(409).json({ error: 'That record already exists.' });
    }
    if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError' || /buffering|not connected/i.test(err.message)) {
        return res.status(503).json({ error: 'The database is unavailable. Please try again shortly.' });
    }

    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error.' });
}

module.exports = { HttpError, validateDocument, errorHandler };
