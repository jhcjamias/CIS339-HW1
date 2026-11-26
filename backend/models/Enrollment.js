const mongoose = require('mongoose');

// Links a student to a course. References use the documents' ObjectIds so
// the relationship survives changes to display fields.
const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student is required.'],
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required.'],
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
        },
    },
    { collection: 'enrollments' },
);

// A student can be enrolled in a given course only once.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true, name: 'unique_student_course' });
// Fast roster lookups by course.
enrollmentSchema.index({ course: 1 }, { name: 'course' });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
