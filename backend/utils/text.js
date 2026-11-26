// "Removed 2 enrollments." / "Removed 1 enrollment." / "No enrollments were affected."
function enrollmentSummary(count) {
    if (count === 0) return 'No enrollments were affected.';
    return `Removed ${count} enrollment${count === 1 ? '' : 's'}.`;
}

module.exports = { enrollmentSummary };
