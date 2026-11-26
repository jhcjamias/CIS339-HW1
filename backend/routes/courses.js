const express = require('express');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { HttpError, validateDocument } = require('../utils/errors');

const router = express.Router();

const findCourse = (courseId) => Course.findOne({ courseId: Course.normalizeCourseId(courseId) });

// GET /api/courses -> all courses sorted by course ID ("CIS 2336" before "CIS 3339")
router.get('/', async (req, res) => {
    const courses = await Course.find().sort({ courseId: 1 }).collation({ locale: 'en', numericOrdering: true });
    res.json(courses);
});

// GET /api/courses/:courseId -> one course
router.get('/:courseId', async (req, res) => {
    const course = await findCourse(req.params.courseId);
    if (!course) throw new HttpError(404, `Course ${req.params.courseId} not found.`);
    res.json(course);
});

// GET /api/courses/:courseId/students -> the course and its enrolled students
router.get('/:courseId/students', async (req, res) => {
    const course = await findCourse(req.params.courseId);
    if (!course) throw new HttpError(404, `Course ${req.params.courseId} not found.`);

    const enrollments = await Enrollment.find({ course: course._id }).populate('student');
    const students = enrollments
        .filter((e) => e.student) // skip enrollments whose student no longer exists
        .map((e) => ({ ...e.student.toJSON(), enrolledAt: e.enrolledAt }))
        .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ course, students });
});

// POST /api/courses -> create a course
router.post('/', async (req, res) => {
    const { courseId, courseName } = req.body ?? {};
    const course = new Course({ courseId, courseName });
    await validateDocument(course);

    if (await Course.exists({ courseId: course.courseId })) {
        throw new HttpError(409, `A course with ID ${course.courseId} already exists.`, {
            courseId: 'This course ID is already in use.',
        });
    }

    await course.save();
    res.status(201).json({ message: `Course ${course.courseId} added successfully.`, course });
});

// DELETE /api/courses/:courseId -> delete a course
router.delete('/:courseId', async (req, res) => {
    const course = await Course.findOneAndDelete({ courseId: Course.normalizeCourseId(req.params.courseId) });
    if (!course) throw new HttpError(404, `Course ${req.params.courseId} not found.`);
    res.json({ message: `Course ${course.courseId} deleted successfully.`, course });
});

module.exports = router;
