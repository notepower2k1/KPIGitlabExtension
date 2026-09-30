/**
 * Full Regression Test Suite for GitLab KPI Extension
 * Validates:
 *   1. Collapsible sections (controls & KPI health card)
 *   2. Daily timesheet audit calculation & rendering
 *   3. Monthly visual charts aggregation & Chart.js integration
 *   4. Tab controller & cross-tab synchronization
 *   5. Extension-wide JavaScript syntax validation (node -c)
 *   6. HTML structure, DOM containers, canvas IDs, offline bundles, Manifest V3 CSP checks
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalSuites = 0;
let passedSuites = 0;
let totalChecks = 0;
let passedChecks = 0;

function printHeader(title) {
    console.log('\n================================================================');
    console.log(`  ${title}`);
    console.log('================================================================');
}

function check(desc, fn) {
    totalChecks++;
    try {
        fn();
        passedChecks++;
        console.log(`  ✔ [PASS] ${desc}`);
    } catch (err) {
        console.error(`  ✖ [FAIL] ${desc}`);
        console.error(`    Error: ${err.message}`);
        throw err;
    }
}

function runSubSuite(suiteName, scriptRelativePath) {
    totalSuites++;
    const fullPath = path.resolve(ROOT_DIR, scriptRelativePath);
    console.log(`\n▶ [SUITE ${totalSuites}] Running ${suiteName} (${scriptRelativePath})...`);
    try {
        const output = execFileSync(process.execPath, [fullPath], {
            cwd: ROOT_DIR,
            encoding: 'utf8',
            stdio: 'pipe'
        });
        const lines = output.trim().split('\n');
        const passLines = lines.filter(l => l.includes('Passed') || l.includes('✔'));
        passLines.forEach(l => console.log(`   ${l.trim()}`));
        passedSuites++;
        console.log(`✔ [SUITE ${totalSuites} PASSED] ${suiteName}`);
    } catch (err) {
        console.error(`✖ [SUITE ${totalSuites} FAILED] ${suiteName}`);
        if (err.stdout) console.error(err.stdout);
        if (err.stderr) console.error(err.stderr);
        throw err;
    }
}

console.log('################################################################');
console.log('#   GitLab KPI Extension - Comprehensive Full Regression Suite  #');
console.log('################################################################');

// --- 1. RUN STANDALONE TEST SUITES ---
runSubSuite('Collapsible Sections Feature', 'scratch/test_collapse_feature.js');
runSubSuite('Daily Timesheet Audit Subsystem', 'scratch/test_timesheet_audit.js');
runSubSuite('Monthly Chart Aggregation & Rendering', 'scratch/test_chart_aggregation.js');
runSubSuite('Tab Controller & Monthly Synchronization', 'scratch/test_tab_controller.js');
runSubSuite('Leave Days (1-day & 0.5-day) Subsystem', 'scratch/test_leave_days.js');
runSubSuite('Check-in & Check-out Alert Subsystem', 'scratch/test_checkin_checkout.js');
runSubSuite('Notepad Multi-Tab Dual-Mode Subsystem', 'scratch/test_notepad_dual_mode.js');

// --- 2. EXTENSION-WIDE JS SYNTAX VALIDATION ---
printHeader('EXTENSION-WIDE JAVASCRIPT SYNTAX VALIDATION');

const jsFilesToValidate = [
    'page/page.js',
    'utils.js',
    'background.js',
    'content_issue.js',
    'content_request.js',
    'popup/popup.js',
    'note/note.js'
];

jsFilesToValidate.forEach(relPath => {
    check(`Syntax check (node -c): ${relPath}`, () => {
        const fullPath = path.resolve(ROOT_DIR, relPath);
        assert(fs.existsSync(fullPath), `File must exist: ${relPath}`);
        // Run node -c on the file
        execFileSync(process.execPath, ['-c', fullPath], {
            cwd: ROOT_DIR,
            encoding: 'utf8',
            stdio: 'pipe'
        });
    });
});

// --- 3. HTML & MANIFEST V3 SECURITY CHECKS ---
printHeader('HTML, DOM STRUCTURE & MANIFEST V3 SECURITY CHECKS');

const pageHtmlPath = path.resolve(ROOT_DIR, 'page/page.html');
const manifestJsonPath = path.resolve(ROOT_DIR, 'manifest.json');

check('page/page.html exists and is readable', () => {
    assert(fs.existsSync(pageHtmlPath), 'page/page.html must exist');
});

const pageHtmlContent = fs.readFileSync(pageHtmlPath, 'utf8');

check('Security: No external CDN or remote script references in page/page.html', () => {
    const scriptRegex = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;
    const foundScripts = [];
    while ((match = scriptRegex.exec(pageHtmlContent)) !== null) {
        foundScripts.push(match[1]);
    }
    assert(foundScripts.length > 0, 'Should find at least 1 script tag in page.html');
    foundScripts.forEach(src => {
        assert(!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//'),
            `Remote/CDN script not allowed under MV3 CSP: ${src}`);
        assert(!src.includes('cdn.jsdelivr.net') && !src.includes('cdnjs.cloudflare.com') && !src.includes('unpkg.com'),
            `CDN script not allowed: ${src}`);
        
        // Ensure local relative script file exists
        const localScriptPath = path.resolve(path.dirname(pageHtmlPath), src);
        assert(fs.existsSync(localScriptPath), `Script target file must exist on disk: ${localScriptPath}`);
    });
});

const noteHtmlPath = path.resolve(ROOT_DIR, 'note/note.html');

check('note/note.html exists and is readable', () => {
    assert(fs.existsSync(noteHtmlPath), 'note/note.html must exist');
});

const noteHtmlContent = fs.readFileSync(noteHtmlPath, 'utf8');

check('Security: No external CDN or remote script references in note/note.html', () => {
    const scriptRegex = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;
    const foundScripts = [];
    while ((match = scriptRegex.exec(noteHtmlContent)) !== null) {
        foundScripts.push(match[1]);
    }
    assert(foundScripts.length > 0, 'Should find at least 1 script tag in note.html');
    foundScripts.forEach(src => {
        assert(!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//'),
            `Remote/CDN script not allowed under MV3 CSP: ${src}`);
        assert(!src.includes('cdn.jsdelivr.net') && !src.includes('cdnjs.cloudflare.com') && !src.includes('unpkg.com'),
            `CDN script not allowed: ${src}`);
        
        // Ensure local relative script file exists
        const localScriptPath = path.resolve(path.dirname(noteHtmlPath), src);
        assert(fs.existsSync(localScriptPath), `Script target file must exist on disk: ${localScriptPath}`);
    });
});

check('Required Offline Vendor Bundles exist and have proper minimum sizes', () => {
    const chartJsPath = path.resolve(ROOT_DIR, 'page/chart.umd.min.js');
    const excelJsPath = path.resolve(ROOT_DIR, 'page/exceljs.min.js');

    assert(fs.existsSync(chartJsPath), 'page/chart.umd.min.js must exist locally');
    const chartStats = fs.statSync(chartJsPath);
    assert(chartStats.size > 100 * 1024, `chart.umd.min.js size (${chartStats.size} bytes) should be > 100KB`);

    assert(fs.existsSync(excelJsPath), 'page/exceljs.min.js must exist locally');
    const excelStats = fs.statSync(excelJsPath);
    assert(excelStats.size > 500 * 1024, `exceljs.min.js size (${excelStats.size} bytes) should be > 500KB`);
});

check('DOM Containers and Tab IDs exist in page/page.html', () => {
    const requiredIds = [
        'tabWorkItemsBtn',
        'tabAnalyticsBtn',
        'tabAnalyticsMonthBadge',
        'workItemsTabContent',
        'analyticsTabContent',
        'monthlyKpiSummaryCards',
        'timesheetSummaryChips',
        'timesheetCalendarGrid',
        'monthlyChartsSection',
        'quickControlsCard',
        'toggleControlsBtn',
        'controlsBody',
        'controlsCollapseArrow',
        'controlsActiveSummary',
        'monthSelect',
        'timeFilterSelect',
        'kpiContainer',
        'kpiHealthContainer'
    ];

    requiredIds.forEach(id => {
        assert(pageHtmlContent.includes(`id="${id}"`), `page.html must contain element with id="${id}"`);
    });
});

check('All 4 Visual Chart Canvas elements exist in page/page.html', () => {
    const chartCanvasIds = [
        'chartWeeklyEstSpent',
        'chartTaskType',
        'chartTaskStatus',
        'chartKpiTrend'
    ];

    chartCanvasIds.forEach(canvasId => {
        const hasCanvas = pageHtmlContent.includes(`id="${canvasId}"`) && pageHtmlContent.includes(`<canvas id="${canvasId}"`);
        assert(hasCanvas, `page.html must contain <canvas id="${canvasId}">`);
    });
});

check('Manifest V3 validity & security configuration in manifest.json', () => {
    assert(fs.existsSync(manifestJsonPath), 'manifest.json must exist');
    const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

    assert.strictEqual(manifestJson.manifest_version, 3, 'Must be Manifest V3');
    assert.strictEqual(manifestJson.background?.service_worker, 'background.js', 'Service worker must be background.js');

    // Verify background worker file
    assert(fs.existsSync(path.resolve(ROOT_DIR, manifestJson.background.service_worker)), 'background.js file must exist');

    // Verify popup HTML
    assert(manifestJson.action?.default_popup, 'Must specify default_popup');
    assert(fs.existsSync(path.resolve(ROOT_DIR, manifestJson.action.default_popup)), 'Popup HTML file must exist');

    // Verify content scripts
    assert(Array.isArray(manifestJson.content_scripts), 'content_scripts must be an array');
    manifestJson.content_scripts.forEach(cs => {
        assert(Array.isArray(cs.js), 'content_script.js must be an array');
        cs.js.forEach(scriptFile => {
            assert(fs.existsSync(path.resolve(ROOT_DIR, scriptFile)), `Content script file must exist: ${scriptFile}`);
        });
    });

    // Verify icon assets
    ['16', '32', '48', '128'].forEach(size => {
        const iconFile = manifestJson.icons?.[size];
        if (iconFile) {
            assert(fs.existsSync(path.resolve(ROOT_DIR, iconFile)), `Icon file must exist: ${iconFile}`);
        }
    });
});

// --- 4. FINAL VERIFICATION SUMMARY ---
printHeader('REGRESSION SUITE EXECUTION SUMMARY');
console.log(`  Sub-suites Passed:  ${passedSuites} / ${totalSuites}`);
console.log(`  Security & Syntax:  ${passedChecks} / ${totalChecks}`);
console.log('\n  RESULT: ALL REGRESSION TESTS AND VERIFICATIONS PASSED SUCCESSFULLY! 🚀');
console.log('================================================================\n');
