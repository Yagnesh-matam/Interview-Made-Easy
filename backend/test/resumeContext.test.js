const test = require('node:test');
const assert = require('node:assert/strict');
const router = require('../routes/resumeRoutes');
const selectResumeContext = router.selectResumeContext;

test('selectResumeContext preserves later sections (projects/education) when long', () => {
    const header = 'EXPERIENCE\n'.repeat(50);
    const skills = 'SKILLS\nReact, Node, Python\n';
    const projects = 'PROJECTS\nBuilt X using Y with Z\n'.repeat(10) + 'UNIQUE_PROJECT_MARKER_12345\n';
    const education = 'EDUCATION\nB.Tech in CS\nUNIQUE_EDU_MARKER_67890\n';
    const longText = header + skills + projects + education + 'EXTRA\n'.repeat(1000);
    const selected = selectResumeContext(longText, 15000);
    assert.ok(selected.includes('UNIQUE_PROJECT_MARKER_12345'), 'project marker should be preserved');
    assert.ok(selected.includes('UNIQUE_EDU_MARKER_67890'), 'education marker should be preserved');
    assert.ok(selected.length <= 15000);
});
