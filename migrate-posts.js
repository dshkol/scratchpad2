import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

const SCRATCHPAD = '/Users/dmitryshkolnik/Projects/scratchpad';
const DEST = '/Users/dmitryshkolnik/Projects/scratchpad2/src/data/blog';

const sources = [
  'content/2017/2017-08-30-starting-a-blog.md',
  'content/2017/2017-10-02-language-diversity-in-canada.Rmd',
  'content/2018/2018-02-19-the-great-wait.Rmd',
  'content/2018/2018-05-10-diversity-and-segregation-i.Rmd',
  'content/2018/2018-06-05-airportr-a-lightweight-package-for-airport-data.Rmd',
  'content/2018/2018-07-01-demographic-tsne.Rmd',
  'content/2018/2018-07-16-better-maps-with-vector-tiles.Rmd',
  'content/2018/2018-08-01-cansim-package-tourism-slopegraphs.Rmd',
  'content/2018/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture.Rmd',
  'content/2018/2018-12-14-normal-canadian-city.Rmd',
  'content/post/2020-07-18-will-walk-for-food-exploring-singapore-hawker-centre-density.Rmd',
  'content/post/2021-02-08-spatially-constrained-clustering-and-regionalization.Rmd',
  'content/post/2025-07-17-census-monkey-typewriter.md',
  'content/post/2025-07-31-census-monkey-typewriter-pt2-from-single-agent-to-multi-agent/index.md',
  'content/post/2026-01-07-the-daily/index.md',
];

function parseYaml(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fm: {}, body: content };
  
  const yamlStr = match[1];
  const body = content.slice(match[0].length).trim();
  const fm = {};
  let currentKey = null;
  let inArray = false;
  let arr = [];
  
  for (const line of yamlStr.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    
    if (t.startsWith('- ') && inArray) {
      arr.push(t.slice(2).trim());
      continue;
    }
    
    if (inArray && !t.startsWith('-')) {
      fm[currentKey] = arr;
      inArray = false;
      arr = [];
    }
    
    const idx = t.indexOf(':');
    if (idx > 0) {
      const key = t.slice(0, idx).trim();
      let val = t.slice(idx + 1).trim();
      
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      
      if (val === '') {
        currentKey = key;
        inArray = true;
        arr = [];
      } else {
        fm[key] = val;
      }
    }
  }
  
  if (inArray) fm[currentKey] = arr;
  return { fm, body };
}

mkdirSync(DEST, { recursive: true });

let count = 0;
for (const src of sources) {
  try {
    const srcPath = join(SCRATCHPAD, src);
    const content = readFileSync(srcPath, 'utf-8');
    const { fm, body } = parseYaml(content);
    
    const title = (fm.title || 'Untitled').replace(/"/g, "'");
    const author = fm.author || 'Dmitry Shkolnik';
    const date = fm.date ? new Date(fm.date).toISOString() : new Date().toISOString();
    const desc = (fm.description || fm.summary || '').replace(/"/g, "'");
    let tags = fm.tags || fm.categories || ['blog'];
    if (!Array.isArray(tags)) tags = [tags];
    
    const newBody = body.replace(/```\{r[^}]*\}/g, '```r');
    
    const slug = fm.slug || basename(src).replace(/\.Rmd$/, '').replace(/\.md$/, '').replace(/^index$/, basename(src.replace(/\/index\.md$/, '')));
    
    let newFm = '---\n';
    newFm += 'title: "' + title + '"\n';
    newFm += 'author: ' + author + '\n';
    newFm += 'pubDatetime: ' + date + '\n';
    if (desc) newFm += 'description: "' + desc + '"\n';
    newFm += 'tags:\n';
    for (const t of tags) newFm += '  - ' + t.toLowerCase() + '\n';
    newFm += '---\n\n';
    
    writeFileSync(join(DEST, slug + '.md'), newFm + newBody);
    console.log('Migrated:', basename(src), '->', slug + '.md');
    count++;
  } catch (e) {
    console.error('Error:', src, e.message);
  }
}
console.log('Total:', count);
