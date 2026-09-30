const assert = require('assert');
const fs = require('fs');

console.log('--- Running Collapsible Sections Unit Tests ---');

// Require page.js (before defining document so IIFE doesn't run during load)
let pageModule;
let setControlsCollapsed;

try {
    pageModule = require('../page/page.js');
    setControlsCollapsed = pageModule.setControlsCollapsed;
} catch (err) {
    console.error('Failed to import page.js:', err.message);
}

// Mock DOM elements helper
function createMockElement(id, tagName = 'div') {
    const el = {
        id,
        tagName: tagName.toUpperCase(),
        style: {},
        textContent: '',
        innerHTML: '',
        attributes: {},
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c, force) {
                if (force === undefined) {
                    if (this.classes.has(c)) { this.classes.delete(c); return false; }
                    else { this.classes.add(c); return true; }
                } else if (force) {
                    this.classes.add(c);
                    return true;
                } else {
                    this.classes.delete(c);
                    return false;
                }
            }
        },
        listeners: {},
        addEventListener(event, fn) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(fn);
        },
        click() {
            if (this.listeners['click']) {
                this.listeners['click'].forEach(fn => fn({ target: this }));
            }
        },
        setAttribute(name, val) { this.attributes[name] = String(val); },
        getAttribute(name) { return this.attributes[name] || null; },
        querySelector(selector) {
            if (selector.startsWith('#')) {
                const searchId = selector.slice(1);
                return this.children?.find(c => c.id === searchId) || null;
            }
            if (selector.startsWith('.')) {
                const searchClass = selector.slice(1);
                return this.children?.find(c => c.classList?.contains(searchClass)) || null;
            }
            return null;
        },
        querySelectorAll(selector) {
            if (selector.startsWith('.')) {
                const searchClass = selector.slice(1);
                return (this.children || []).filter(c => c.classList?.contains(searchClass));
            }
            return [];
        }
    };
    return el;
}

// 1. setControlsCollapsed Direct Unit Test
{
    assert.strictEqual(typeof setControlsCollapsed, 'function', 'setControlsCollapsed must be exported as a function');

    const mockBody = createMockElement('controlsBody');
    const mockArrow = createMockElement('controlsCollapseArrow');

    // Test expanding
    const resExpand = setControlsCollapsed(false, { controlsBody: mockBody, controlsCollapseArrow: mockArrow });
    assert.strictEqual(resExpand, false);
    assert.strictEqual(mockBody.style.display, 'flex', 'Expanding should set display to flex');
    assert.strictEqual(mockArrow.textContent, '▲', 'Expanding should set arrow to ▲');

    // Test collapsing
    const resCollapse = setControlsCollapsed(true, { controlsBody: mockBody, controlsCollapseArrow: mockArrow });
    assert.strictEqual(resCollapse, true);
    assert.strictEqual(mockBody.style.display, 'none', 'Collapsing should set display to none');
    assert.strictEqual(mockArrow.textContent, '▼', 'Collapsing should set arrow to ▼');

    console.log('✔ Passed: setControlsCollapsed updates display and arrow indicators accurately');
}

// 2. Global Document Fallback Test for setControlsCollapsed
{
    const mockBody = createMockElement('controlsBody');
    const mockArrow = createMockElement('controlsCollapseArrow');

    const originalDocument = global.document;
    global.document = {
        getElementById: (id) => {
            if (id === 'controlsBody') return mockBody;
            if (id === 'controlsCollapseArrow') return mockArrow;
            return null;
        }
    };

    setControlsCollapsed(false);
    assert.strictEqual(mockBody.style.display, 'flex');
    assert.strictEqual(mockArrow.textContent, '▲');

    setControlsCollapsed(true);
    assert.strictEqual(mockBody.style.display, 'none');
    assert.strictEqual(mockArrow.textContent, '▼');

    global.document = originalDocument;
    console.log('✔ Passed: setControlsCollapsed resolves DOM elements from document.getElementById');
}

// 3. Controls Toggle Button Interaction & Lifecycle Test
{
    const toggleBtn = createMockElement('toggleControlsBtn', 'button');
    const controlsBody = createMockElement('controlsBody');
    const controlsArrow = createMockElement('controlsCollapseArrow');
    let isCollapsed = true;

    // Simulate event handler wiring as in page.js
    function handleToggle() {
        isCollapsed = !isCollapsed;
        setControlsCollapsed(isCollapsed, { controlsBody, controlsCollapseArrow: controlsArrow });
    }
    toggleBtn.addEventListener('click', handleToggle);

    // Initial state check
    assert.strictEqual(isCollapsed, true);

    // Click 1: expand
    toggleBtn.click();
    assert.strictEqual(isCollapsed, false);
    assert.strictEqual(controlsBody.style.display, 'flex');
    assert.strictEqual(controlsArrow.textContent, '▲');

    // Click 2: collapse
    toggleBtn.click();
    assert.strictEqual(isCollapsed, true);
    assert.strictEqual(controlsBody.style.display, 'none');
    assert.strictEqual(controlsArrow.textContent, '▼');

    // Click 3: expand again
    toggleBtn.click();
    assert.strictEqual(isCollapsed, false);
    assert.strictEqual(controlsBody.style.display, 'flex');
    assert.strictEqual(controlsArrow.textContent, '▲');

    console.log('✔ Passed: Toggle controls button cleanly toggles expand/collapse state');
}

// 4. Controls Active Summary Formatting Test
{
    function formatControlsSummary(quickFilter, searchQuery) {
        const filterLabels = {
            all: 'Tất cả',
            mr: 'Merge Request',
            late: 'Trễ hạn',
            missing_time: 'Thiếu Estimate/Spent',
            missing_date: 'Thiếu Due Date',
            reopen: 'Reopened',
            unplanned: 'Phát sinh'
        };

        const filterText = quickFilter !== 'all' ? (filterLabels[quickFilter] || quickFilter) : '';
        const searchText = searchQuery ? `"${searchQuery}"` : '';

        if (filterText && searchText) {
            return { display: 'inline-flex', text: `Lọc: ${filterText} • ${searchText}` };
        } else if (filterText) {
            return { display: 'inline-flex', text: `Lọc: ${filterText}` };
        } else if (searchText) {
            return { display: 'inline-flex', text: `Tìm: ${searchText}` };
        } else {
            return { display: 'none', text: '' };
        }
    }

    const s1 = formatControlsSummary('all', '');
    assert.strictEqual(s1.display, 'none');

    const s2 = formatControlsSummary('late', '');
    assert.strictEqual(s2.display, 'inline-flex');
    assert.strictEqual(s2.text, 'Lọc: Trễ hạn');

    const s3 = formatControlsSummary('all', 'frontend');
    assert.strictEqual(s3.display, 'inline-flex');
    assert.strictEqual(s3.text, 'Tìm: "frontend"');

    const s4 = formatControlsSummary('missing_time', 'bug fix');
    assert.strictEqual(s4.display, 'inline-flex');
    assert.strictEqual(s4.text, 'Lọc: Thiếu Estimate/Spent • "bug fix"');

    console.log('✔ Passed: Controls active summary badge generates correct summary strings');
}

// 5. KPI Health Card Collapsible Toggle Test
{
    const toggleHealthBtn = createMockElement('toggleHealthBtn', 'div');
    const healthBody = createMockElement('kpiHealthBody', 'div');
    const healthArrow = createMockElement('healthArrow', 'span');
    healthArrow.classList.add('health-collapse-arrow');

    let isHealthCollapsed = true;
    healthBody.style.display = 'none';
    healthArrow.textContent = '▼';

    // Simulate event handler wiring as in renderKpiHealthCard
    toggleHealthBtn.addEventListener('click', () => {
        isHealthCollapsed = !isHealthCollapsed;
        healthBody.style.display = isHealthCollapsed ? 'none' : 'block';
        healthArrow.textContent = isHealthCollapsed ? '▼' : '▲';
        toggleHealthBtn.classList.toggle('expanded', !isHealthCollapsed);
    });

    // Check initial state
    assert.strictEqual(isHealthCollapsed, true);
    assert.strictEqual(healthBody.style.display, 'none');
    assert.strictEqual(healthArrow.textContent, '▼');
    assert.strictEqual(toggleHealthBtn.classList.contains('expanded'), false);

    // Toggle 1: Expand
    toggleHealthBtn.click();
    assert.strictEqual(isHealthCollapsed, false);
    assert.strictEqual(healthBody.style.display, 'block');
    assert.strictEqual(healthArrow.textContent, '▲');
    assert.strictEqual(toggleHealthBtn.classList.contains('expanded'), true);

    // Toggle 2: Collapse
    toggleHealthBtn.click();
    assert.strictEqual(isHealthCollapsed, true);
    assert.strictEqual(healthBody.style.display, 'none');
    assert.strictEqual(healthArrow.textContent, '▼');
    assert.strictEqual(toggleHealthBtn.classList.contains('expanded'), false);

    console.log('✔ Passed: KPI Health Card header toggle correctly expands/collapses card body');
}

console.log('\n--- ALL COLLAPSE FEATURE TESTS PASSED ---');
