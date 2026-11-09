import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = 'https://dongyu19920904.github.io/awesome-image-2-6-gif/';
const githubDocs = 'https://github.com/dongyu19920904/awesome-image-2-6-gif/blob/main/';
const media = JSON.parse(await readFile(new URL('../data/gallery-media.json', import.meta.url), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]
));

for (const item of media.filter((record) => record.featured)) {
  const slug = item.id;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid case slug');
  const poster = new URL('../public/poster/' + slug + '.webp', import.meta.url);
  await readFile(poster);
  const title = escape(item.title_zh + ' · ' + item.title_en);
  const description = escape(item.description_zh + ' ' + item.description_en);
  const url = root + 'case/' + slug + '/';
  const directory = new URL('../dist/case/' + slug + '/', import.meta.url);
  const script = [
    "const target = new URL('../../', location.href);",
    "const settings = new URLSearchParams(location.search);",
    "for (const key of ['lang', 'category', 'route', 'q', 'playable']) {",
    '  if (settings.has(key)) target.searchParams.set(key, settings.get(key));',
    '}',
    "target.searchParams.set('case', " + JSON.stringify(slug) + ');',
    'location.replace(target);'
  ].join('\n');
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), '<!doctype html>\n' +
    '<html lang="zh-CN"><head><meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + title + '</title>\n' +
    '<meta name="description" content="' + description + '">\n' +
    '<link rel="canonical" href="' + url + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:url" content="' + url + '">\n' +
    '<meta property="og:title" content="' + title + '">\n' +
    '<meta property="og:description" content="' + description + '">\n' +
    '<meta property="og:image" content="' + root + 'poster/' + slug + '.webp">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '</head><body><main><h1>' + title + '</h1><p>' + description + '</p>\n' +
    '<img src="../../poster/' + slug + '.webp" width="127" height="97" alt="' + title + '">\n' +
    '<p>@' + escape(item.author) + ' · <a href="' + escape(item.license_url) + '">' + escape(item.license) + '</a></p>\n' +
    '<p><a href="../../?case=' + slug + '">打开互动案例 / Open interactive case</a></p>\n' +
    '<p><a href="' + escape(item.source_url) + '">作者原词 / Creator prompt</a> · ' +
    '<a href="' + escape(githubDocs + item.next_step) + '">微信下一步 / WeChat next step</a></p>\n' +
    '</main><script>' + script + '</script></body></html>\n');
}
