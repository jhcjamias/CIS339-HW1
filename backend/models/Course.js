const mongoose = require('mongoose');

// Course IDs are stored uppercase with single spaces ("CIS 3339"), so the
// unique index also rejects "cis  3339" as a duplicate.
function normalizeCourseId(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

const courseSchema = new mongoose.Schema(
    {
        courseId: {
            type: String,
            required: [true, 'Course ID is required.'],
            set: normalizeCourseId,
            match: [
                /^[A-Z0-9][A-Z0-9 -]{1,19}$/,
                'Course ID may contain letters, numbers, spaces, and hyphens (e.g. CIS 3339).',
            ],
        },
        courseName: {
            type: String,
            required: [true, 'Course name is required.'],
            set: (value) => String(value ?? '').trim().replace(/\s+/g, ' '),
            maxlength: [100, 'Course name must be 100 characters or fewer.'],
        },
    },
    {
        collection: 'courses',
        timestamps: true,
        toJSON: {
            // API shape: { courseId, courseName }
            transform: (doc, ret) => ({ courseId: ret.courseId, courseName: ret.courseName }),
        },
    },
);

courseSchema.index({ courseId: 1 }, { unique: true, name: 'unique_courseId' });

const Course = mongoose.model('Course', courseSchema);
Course.normalizeCourseId = normalizeCourseId;

module.exports = Course;
