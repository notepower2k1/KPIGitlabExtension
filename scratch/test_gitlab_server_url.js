/**
 * Unit Test Suite for Task 1:
 * Core URL Normalization Utility, Token Generation URL & Dictionary Tokens
 */

const assert = require('assert');
const path = require('path');

console.log('=== Running Suite: Task 1 - Core URL Normalization & Dictionary Tokens ===\n');

// 1. Module Exports & Function Availability in utils.js
console.log('--- 1. Testing exports from utils.js ---');
const utils = require('../utils.js');

assert.strictEqual(typeof utils.sanitizeGitlabUrl, 'function', 'sanitizeGitlabUrl must be exported from utils.js');
assert.strictEqual(typeof utils.getTokenGenerationUrl, 'function', 'getTokenGenerationUrl must be exported from utils.js');
assert.strictEqual(typeof utils.getGitlabServerUrl, 'function', 'getGitlabServerUrl must be exported from utils.js');
console.log('✔ Passed: utils.js exports sanitizeGitlabUrl, getTokenGenerationUrl, and getGitlabServerUrl');

// 2. Testing sanitizeGitlabUrl
console.log('\n--- 2. Testing sanitizeGitlabUrl ---');
const { sanitizeGitlabUrl } = utils;

// 2.1 Empty / Null / Whitespace inputs
assert.strictEqual(sanitizeGitlabUrl(null), 'https://gitlab.com', 'null should return default URL');
assert.strictEqual(sanitizeGitlabUrl(undefined), 'https://gitlab.com', 'undefined should return default URL');
assert.strictEqual(sanitizeGitlabUrl(''), 'https://gitlab.com', 'empty string should return default URL');
assert.strictEqual(sanitizeGitlabUrl('   '), 'https://gitlab.com', 'whitespace string should return default URL');
assert.strictEqual(sanitizeGitlabUrl(null, 'https://custom.gitlab.org'), 'https://custom.gitlab.org', 'custom defaultUrl should be respected for null');
assert.strictEqual(sanitizeGitlabUrl('', 'https://custom.gitlab.org'), 'https://custom.gitlab.org', 'custom defaultUrl should be respected for empty string');

// 2.2 Missing protocol (prepends https://)
assert.strictEqual(sanitizeGitlabUrl('gitlab.com'), 'https://gitlab.com', 'missing protocol on gitlab.com');
assert.strictEqual(sanitizeGitlabUrl('gitlab.mycorp.vn'), 'https://gitlab.mycorp.vn', 'missing protocol on custom domain');
assert.strictEqual(sanitizeGitlabUrl('192.168.1.100:8080'), 'https://192.168.1.100:8080', 'missing protocol with IP and port');

// 2.3 Explicit http:// and https:// protocols preserved
assert.strictEqual(sanitizeGitlabUrl('http://gitlab.internal.lan'), 'http://gitlab.internal.lan', 'http:// protocol should be preserved');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.internal.lan'), 'https://gitlab.internal.lan', 'https:// protocol should be preserved');

// 2.4 Stripping deep subpaths and query/hash
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/explore'), 'https://gitlab.com', 'should strip /explore subpath');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/group/project/-/issues/123'), 'https://gitlab.com', 'should strip project/issue subpath');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.mycorp.vn/sub/path?param=1#section'), 'https://gitlab.mycorp.vn', 'should strip queries and hash');

// 2.5 Removing trailing slashes
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/'), 'https://gitlab.com', 'single trailing slash');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.mycorp.vn///'), 'https://gitlab.mycorp.vn', 'multiple trailing slashes');
assert.strictEqual(sanitizeGitlabUrl('gitlab.mycorp.vn///'), 'https://gitlab.mycorp.vn', 'missing protocol with multiple trailing slashes');

// 2.6 Preserving port numbers
assert.strictEqual(sanitizeGitlabUrl('http://192.168.1.50:8080/'), 'http://192.168.1.50:8080', 'http IP with port and trailing slash');
assert.strictEqual(sanitizeGitlabUrl('https://gitlab.company.com:8443/dashboard'), 'https://gitlab.company.com:8443', 'https custom port with subpath');
assert.strictEqual(sanitizeGitlabUrl('localhost:3000'), 'https://localhost:3000', 'localhost with port');

// 2.7 Invalid URLs (new URL throws)
assert.strictEqual(sanitizeGitlabUrl('http://::invalid::'), 'https://gitlab.com', 'invalid URL should fallback to defaultUrl');
assert.strictEqual(sanitizeGitlabUrl('http://[:::123]', 'https://fallback.com'), 'https://fallback.com', 'invalid URL with custom defaultUrl');
console.log('✔ Passed: sanitizeGitlabUrl handles defaults, protocols, subpaths, trailing slashes, ports, and errors');

// 3. Testing getTokenGenerationUrl
console.log('\n--- 3. Testing getTokenGenerationUrl ---');
const { getTokenGenerationUrl } = utils;

assert.strictEqual(
    getTokenGenerationUrl('https://gitlab.com'),
    'https://gitlab.com/-/user_settings/personal_access_tokens',
    'standard gitlab.com'
);
assert.strictEqual(
    getTokenGenerationUrl('https://gitlab.mycorp.vn/'),
    'https://gitlab.mycorp.vn/-/user_settings/personal_access_tokens',
    'custom domain with trailing slash'
);
assert.strictEqual(
    getTokenGenerationUrl('gitlab.internal:8080/explore'),
    'https://gitlab.internal:8080/-/user_settings/personal_access_tokens',
    'missing protocol with port and subpath'
);
assert.strictEqual(
    getTokenGenerationUrl(''),
    'https://gitlab.com/-/user_settings/personal_access_tokens',
    'empty string falls back to gitlab.com'
);
assert.strictEqual(
    getTokenGenerationUrl(null),
    'https://gitlab.com/-/user_settings/personal_access_tokens',
    'null falls back to gitlab.com'
);
console.log('✔ Passed: getTokenGenerationUrl correctly generates personal access tokens URL');

// 4. Testing getGitlabServerUrl
console.log('\n--- 4. Testing getGitlabServerUrl ---');
const { getGitlabServerUrl } = utils;

(async () => {
    // 4.1 With storageArea providing gitlabServerUrl
    const mockStorageWithUrl = {
        get: async (keys) => ({ gitlabServerUrl: 'https://gitlab.internal.corp/subpath/' })
    };
    const urlFromStorage = await getGitlabServerUrl(mockStorageWithUrl);
    assert.strictEqual(urlFromStorage, 'https://gitlab.internal.corp', 'should sanitize stored URL');

    // 4.2 With storageArea returning empty object (fallback)
    const mockStorageEmpty = {
        get: async (keys) => ({})
    };
    const defaultFallbackUrl = await getGitlabServerUrl(mockStorageEmpty);
    assert.strictEqual(defaultFallbackUrl, 'https://gitlab.com', 'should return default fallback');

    const customFallbackUrl = await getGitlabServerUrl(mockStorageEmpty, 'https://default.corp');
    assert.strictEqual(customFallbackUrl, 'https://default.corp', 'should return custom fallback');

    // 4.3 With chrome.storage.local mock (storageArea omitted)
    const originalChrome = global.chrome;
    global.chrome = {
        storage: {
            local: {
                get: (keys, cb) => {
                    const res = { gitlabServerUrl: 'http://gitlab.dev.local:9000' };
                    if (typeof cb === 'function') {
                        cb(res);
                        return;
                    }
                    return Promise.resolve(res);
                }
            }
        }
    };
    const chromeStoredUrl = await getGitlabServerUrl();
    assert.strictEqual(chromeStoredUrl, 'http://gitlab.dev.local:9000', 'should read from chrome.storage.local');

    // 4.4 Without chrome and without storageArea (graceful fallback)
    delete global.chrome;
    const noStorageUrl = await getGitlabServerUrl(null, 'https://fallback-offline.org');
    assert.strictEqual(noStorageUrl, 'https://fallback-offline.org', 'should return fallback when no storage is available');

    // Restore chrome
    if (originalChrome) {
        global.chrome = originalChrome;
    } else {
        delete global.chrome;
    }
    console.log('✔ Passed: getGitlabServerUrl works with custom storage, chrome.storage.local, and fallbacks');

    // 5. Testing Dictionary Tokens in i18n.js
    console.log('\n--- 5. Testing i18n Dictionary Tokens for Server URL ---');
    const i18n = require('../i18n.js');
    const vi = i18n.I18N_DICTIONARIES.vi;
    const en = i18n.I18N_DICTIONARIES.en;

    const expectedTokens = [
        'gitlabServerUrlLabel',
        'gitlabServerUrlPlaceholder',
        'invalidServerUrl',
        'serverUrlSaved',
        'getTokenHelp'
    ];

    for (const key of expectedTokens) {
        assert.ok(key in vi, `Token "${key}" must exist in Vietnamese dictionary`);
        assert.ok(key in en, `Token "${key}" must exist in English dictionary`);
        assert.strictEqual(typeof vi[key], 'string', `Token "${key}" in VI must be a string`);
        assert.strictEqual(typeof en[key], 'string', `Token "${key}" in EN must be a string`);
        assert.ok(vi[key].length > 0, `Token "${key}" in VI must not be empty`);
        assert.ok(en[key].length > 0, `Token "${key}" in EN must not be empty`);
    }

    // Verify exact expected text values
    assert.strictEqual(vi.gitlabServerUrlLabel, 'GitLab Server URL:');
    assert.strictEqual(en.gitlabServerUrlLabel, 'GitLab Server URL:');
    assert.strictEqual(vi.gitlabServerUrlPlaceholder, 'https://gitlab.com hoặc server riêng...');
    assert.strictEqual(en.gitlabServerUrlPlaceholder, 'https://gitlab.com or self-hosted server...');
    assert.strictEqual(vi.invalidServerUrl, 'Vui lòng nhập GitLab Server URL hợp lệ');
    assert.strictEqual(en.invalidServerUrl, 'Please enter a valid GitLab Server URL');
    assert.strictEqual(vi.serverUrlSaved, 'Đã lưu GitLab Server URL thành công');
    assert.strictEqual(en.serverUrlSaved, 'GitLab Server URL saved successfully');
    assert.strictEqual(vi.getTokenHelp, 'Lấy Access Token tại server này');
    assert.strictEqual(en.getTokenHelp, 'Get Access Token from this server');

    // Verify translation via t()
    assert.strictEqual(i18n.t('gitlabServerUrlLabel', null, 'vi'), 'GitLab Server URL:');
    assert.strictEqual(i18n.t('gitlabServerUrlLabel', null, 'en'), 'GitLab Server URL:');
    assert.strictEqual(i18n.t('invalidServerUrl', null, 'vi'), 'Vui lòng nhập GitLab Server URL hợp lệ');
    assert.strictEqual(i18n.t('invalidServerUrl', null, 'en'), 'Please enter a valid GitLab Server URL');

    console.log('✔ Passed: All 5 required dictionary tokens exist in VI and EN with 100% parity');
    console.log('\n🎉 ALL TASK 1 TESTS PASSED! 🎉\n');

    // =========================================================================
    // TASK 2: POPUP LOGIN SCREEN & SETTINGS CARD INTEGRATION
    // =========================================================================
    console.log('\n=============================================================');
    console.log('=== Running Suite: Task 2 - Popup Login Screen & Settings ===');
    console.log('=============================================================');

    const fs = require('fs');

    // 6. Testing popup/popup.html markup
    console.log('\n--- 6. Testing popup/popup.html Markup for Server URL ---');
    const popupHtmlPath = path.resolve(__dirname, '../popup/popup.html');
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

    // 6.1 Server URL input on login screen
    assert.ok(popupHtml.includes('id="gitlabServerUrlInput"'), 'popup.html must have #gitlabServerUrlInput');
    assert.ok(popupHtml.includes('data-i18n="gitlabServerUrlLabel"'), 'popup.html must have label with data-i18n="gitlabServerUrlLabel"');
    assert.ok(popupHtml.includes('data-i18n-placeholder="gitlabServerUrlPlaceholder"'), 'popup.html must have data-i18n-placeholder="gitlabServerUrlPlaceholder"');

    // 6.2 Quick Select Pills
    assert.ok(popupHtml.includes('class="quick-url-pills"') || popupHtml.includes("class='quick-url-pills'"), 'popup.html must have container .quick-url-pills');
    assert.ok(popupHtml.includes('data-url="https://gitlab.com"'), 'popup.html must have quick pill with data-url="https://gitlab.com"');
    assert.ok(popupHtml.includes('data-url="https://gitlab.widosoft.com"'), 'popup.html must have quick pill with data-url="https://gitlab.widosoft.com"');
    assert.ok(popupHtml.includes('quick-url-pill'), 'popup.html must have .quick-url-pill classes');

    // 6.3 Dynamic Token Help Link
    assert.ok(popupHtml.includes('id="tokenHelpLink"'), 'popup.html must have #tokenHelpLink');
    assert.ok(popupHtml.includes('target="_blank"'), 'tokenHelpLink must open in new tab (target="_blank")');
    assert.ok(popupHtml.includes('data-i18n="getTokenHelp"'), 'tokenHelpLink or its inner text must use data-i18n="getTokenHelp"');

    // 6.4 Settings Card / Tab Server URL Controls
    assert.ok(popupHtml.includes('id="settingsServerUrlInput"'), 'popup.html must have #settingsServerUrlInput in settings');
    assert.ok(popupHtml.includes('id="saveServerUrlBtn"'), 'popup.html must have #saveServerUrlBtn');
    assert.ok(popupHtml.includes('id="settings-tab"') || popupHtml.includes('class="server-settings-card"'), 'popup.html must have settings-tab or server-settings-card');
    assert.ok(popupHtml.includes('id="saveServerUrlMsg"'), 'popup.html must have feedback message container #saveServerUrlMsg');

    console.log('✔ Passed: popup.html contains all required server URL elements, quick pills, and settings controls');

    // 7. Testing popup/popup.css Styling
    console.log('\n--- 7. Testing popup/popup.css Styles for Server URL ---');
    const popupCssPath = path.resolve(__dirname, '../popup/popup.css');
    const popupCss = fs.readFileSync(popupCssPath, 'utf8');

    assert.ok(popupCss.includes('.server-url-group'), 'popup.css must style .server-url-group');
    assert.ok(popupCss.includes('.quick-url-pills'), 'popup.css must style .quick-url-pills');
    assert.ok(popupCss.includes('.quick-url-pill'), 'popup.css must style .quick-url-pill');
    assert.ok(popupCss.includes('.quick-url-pill.active'), 'popup.css must style .quick-url-pill.active');
    assert.ok(popupCss.includes('.token-help-link'), 'popup.css must style .token-help-link');

    console.log('✔ Passed: popup.css contains styling rules for server URL groups, pills, and dynamic token link');

    // 8. Testing popup/popup.js Logic & Helpers
    console.log('\n--- 8. Testing popup/popup.js Helpers & Logic ---');
    const popupModule = require('../popup/popup.js');

    assert.strictEqual(typeof popupModule.updateTokenHelpLink, 'function', 'popup.js must export updateTokenHelpLink');
    assert.strictEqual(typeof popupModule.handleSaveServerUrl, 'function', 'popup.js must export handleSaveServerUrl');
    assert.strictEqual(typeof popupModule.fetchUserProfile, 'function', 'popup.js must export fetchUserProfile');

    // 8.1 Testing updateTokenHelpLink with mock document
    {
        class MockClassList {
            constructor() { this.classes = new Set(); }
            add(c) { this.classes.add(c); }
            remove(c) { this.classes.delete(c); }
            contains(c) { return this.classes.has(c); }
        }

        const pill1 = {
            getAttribute: (attr) => attr === 'data-url' ? 'https://gitlab.com' : null,
            classList: new MockClassList()
        };
        const pill2 = {
            getAttribute: (attr) => attr === 'data-url' ? 'https://gitlab.widosoft.com' : null,
            classList: new MockClassList()
        };

        const mockLink = {
            href: '',
            setAttribute(k, v) { this[k] = v; }
        };

        const mockDoc = {
            elements: {
                tokenHelpLink: mockLink
            },
            getElementById(id) { return this.elements[id] || null; },
            querySelectorAll(sel) {
                if (sel === '.quick-url-pill') return [pill1, pill2];
                return [];
            }
        };

        // When server is gitlab.com
        popupModule.updateTokenHelpLink('https://gitlab.com', mockDoc);
        assert.strictEqual(mockLink.href, 'https://gitlab.com/-/user_settings/personal_access_tokens');
        assert.ok(pill1.classList.contains('active'), 'pill1 should be active for gitlab.com');
        assert.ok(!pill2.classList.contains('active'), 'pill2 should not be active for gitlab.com');

        // When server is gitlab.widosoft.com
        popupModule.updateTokenHelpLink('gitlab.widosoft.com', mockDoc);
        assert.strictEqual(mockLink.href, 'https://gitlab.widosoft.com/-/user_settings/personal_access_tokens');
        assert.ok(!pill1.classList.contains('active'), 'pill1 should not be active for widosoft');
        assert.ok(pill2.classList.contains('active'), 'pill2 should be active for widosoft');

        // When server is a custom third-party domain
        popupModule.updateTokenHelpLink('https://gitlab.customcorp.vn/subpath', mockDoc);
        assert.strictEqual(mockLink.href, 'https://gitlab.customcorp.vn/-/user_settings/personal_access_tokens');
        assert.ok(!pill1.classList.contains('active'), 'neither pill should be active');
        assert.ok(!pill2.classList.contains('active'), 'neither pill should be active');

        console.log('✔ Passed: updateTokenHelpLink correctly updates link href and active pill state');
    }

    // 8.2 Testing handleSaveServerUrl
    {
        let stored = {};
        const mockStorage = {
            set: async (obj) => { Object.assign(stored, obj); }
        };

        const savedUrl = await popupModule.handleSaveServerUrl('gitlab.mycorp.io:8080/deep/path', mockStorage);
        assert.strictEqual(savedUrl, 'https://gitlab.mycorp.io:8080', 'should sanitize and return origin with port');
        assert.strictEqual(stored.gitlabServerUrl, 'https://gitlab.mycorp.io:8080', 'should persist sanitized url in storage');

        // Test fallback on empty input
        const fallbackUrl = await popupModule.handleSaveServerUrl('', mockStorage);
        assert.strictEqual(fallbackUrl, 'https://gitlab.com', 'empty should fallback to gitlab.com');
        assert.strictEqual(stored.gitlabServerUrl, 'https://gitlab.com');

        console.log('✔ Passed: handleSaveServerUrl normalizes and stores server URL');
    }

    // 8.3 Testing fetchUserProfile with custom serverUrl and mock fetch
    {
        const calls = [];
        const mockFetchSuccess = async (url, opts) => {
            calls.push({ url, opts });
            return {
                ok: true,
                json: async () => ({ id: 42, username: 'testuser', avatar_url: 'https://avatar.png' })
            };
        };

        const user = await popupModule.fetchUserProfile('my-token-123', 'gitlab.custom.lan:9090', mockFetchSuccess);
        assert.ok(user, 'should return user profile');
        assert.strictEqual(user.username, 'testuser');
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].url, 'https://gitlab.custom.lan:9090/api/v4/user');
        assert.strictEqual(calls[0].opts.headers['PRIVATE-TOKEN'], 'my-token-123');

        // Test 401 Unauthorized
        const mockFetch401 = async (url, opts) => ({
            ok: false,
            status: 401,
            json: async () => ({ message: '401 Unauthorized' })
        });
        const unauthorizedUser = await popupModule.fetchUserProfile('bad-token', 'https://gitlab.com', mockFetch401);
        assert.strictEqual(unauthorizedUser, null, '401 response should return null');

        console.log('✔ Passed: fetchUserProfile targets dynamic server URL and handles authorization responses');
    }

    console.log('\n🎉 ALL TASK 2 TESTS PASSED! 🎉\n');
})().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});

