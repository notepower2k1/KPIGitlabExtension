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
})().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
