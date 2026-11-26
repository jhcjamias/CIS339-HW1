const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: [true, 'Student ID is required.'],
            trim: true,
            match: [/^\d+$/, 'Student ID must contain digits only.'],
            maxlength: [20, 'Student ID must be 20 digits or fewer.'],
        },
        name: {
            type: String,
            required: [true, 'Name is required.'],
            trim: true,
            maxlength: [100, 'Name must be 100 characters or fewer.'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required.'],
            trim: true,
            match: [/^[\d\s()+-]{7,20}$/, 'Enter a valid phone number (e.g. 555-1234).'],
        },
        zip: {
            type: String,
            required: [true, 'ZIP code is required.'],
            trim: true,
            match: [/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits (or ZIP+4).'],
        },
    },
    {
        collection: 'students',
        timestamps: true,
        id: false, // the API exposes the student ID as `id`, not Mongo's _id
        toJSON: {
            // API shape: { id, name, phone, zip }
            transform: (doc, ret) => ({
                id: ret.studentId,
                name: ret.name,
                phone: ret.phone,
                zip: ret.zip,
            }),
        },
    },
);

// Prevent duplicate student IDs at the database level.
studentSchema.index({ studentId: 1 }, { unique: true, name: 'unique_studentId' });
// Speeds up name sorting and searches.
studentSchema.index({ name: 1 }, { name: 'name' });

module.exports = mongoose.model('Student', studentSchema);
