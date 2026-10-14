import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const userscriptPath = join(root, 'main.user.js');
const logoPath = join(root, 'uth-question-importer', 'logo.png');
const [source, logo] = await Promise.all([
  readFile(userscriptPath, 'utf8'),
  readFile(logoPath)
]);
const icon = `data:image/png;base64,${logo.toString('base64')}`;
if (!/^\/\/ @icon\s+.*$/m.test(source)) {
  throw new Error('Không tìm thấy dòng metadata @icon trong main.user.js.');
}
const output = source.replace(/^\/\/ @icon\s+.*$/m, `// @icon         ${icon}`);
await writeFile(userscriptPath, output, 'utf8');
console.log(`Đã nhúng logo UTH vào: ${userscriptPath}`);
console.log(`Kích thước logo: ${logo.length.toLocaleString('vi-VN')} byte`);
