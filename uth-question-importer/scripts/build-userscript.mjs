import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
const [vendor, coreSource, pageSource, appSource, icon] = await Promise.all([
  readFile(join(root, 'vendor/xlsx.full.min.js')),
  readFile(join(root, 'core.js'), 'utf8'),
  readFile(join(root, 'page.js'), 'utf8'),
  readFile(join(root, 'userscript/app.js'), 'utf8'),
  readFile(join(root, 'logo.png'))
]);

const stripExports = source => source.replace(/^export\s+/gm, '');
const iconData = `data:image/png;base64,${icon.toString('base64')}`;
const xlsxGzipBase64 = gzipSync(vendor, {level:9}).toString('base64');
const metadata = `// ==UserScript==
// @name         UTH Question Importer
// @namespace    https://github.com/Glasspham
// @version      ${manifest.version}
// @description  ${manifest.description}
// @author       Glasspham
// @match        https://courses.ut.edu.vn/*
// @icon         ${iconData}
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==`;

const output = `${metadata}

(() => {
'use strict';

${stripExports(coreSource)}

${stripExports(pageSource)}

${appSource
  .replaceAll('__UTH_ICON_DATA__', iconData)
  .replaceAll('__XLSX_GZIP_BASE64__', xlsxGzipBase64)}
})();
`;

const target = resolve(root, '..', `UTH-Question-Importer-v${manifest.version}.user.js`);
await writeFile(target, output, 'utf8');
console.log(`Đã tạo: ${target}`);
console.log(`Phiên bản: ${manifest.version} | Kích thước: ${Buffer.byteLength(output).toLocaleString('vi-VN')} byte`);
console.log(`SheetJS chỉ nạp khi chọn Excel | Dữ liệu nén: ${xlsxGzipBase64.length.toLocaleString('vi-VN')} ký tự`);
