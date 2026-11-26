const mongoose = require('mongoose');
const Student = require('./Student');
const Course = require('./Course');

// Schema-level referential check: the referenced document must exist.
const mustExist = (Model, label) => ({
    validator: async (id) => Boolean(await Model.exists({ _id: id })),
    message: `${label} does not exist.`,
});

// Links a student to a course. References use the documents' ObjectIds so
// the relationship survives changes to display fields.
const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student is required.'],
            validate: mustExist(Student, 'Student'),
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required.'],
            validate: mustExist(Course, 'Course'),
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

// Deletes enrollments whose student or course no longer exists (e.g. if the
// server stopped midway through a cascading delete). Returns the count removed.
enrollmentSchema.statics.removeOrphans = async function removeOrphans() {
    const orphans = await this.aggregate([
        { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
        { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseDoc' } },
        { $match: { $or: [{ studentDoc: { $size: 0 } }, { courseDoc: { $size: 0 } }] } },
        { $project: { _id: 1 } },
    ]);
    if (orphans.length === 0) return 0;
    const { deletedCount } = await this.deleteMany({ _id: { $in: orphans.map((o) => o._id) } });
    return deletedCount;
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
