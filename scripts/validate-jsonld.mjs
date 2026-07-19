import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/validate-jsonld.mjs <html-file>');

const filename = path.resolve(input);
if (!fs.existsSync(filename)) throw new Error(`HTML file not found: ${input}`);

const html = fs.readFileSync(filename, 'utf8');
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const article = blocks.find((schema) => schema['@type'] === 'TechArticle');
const faqCount = [...html.matchAll(/<details>/g)].length;

if (!article) throw new Error('TechArticle JSON-LD is missing');
if (article.url !== 'https://zennote.app/benz_glb200_manual') throw new Error('TechArticle URL mismatch');
if (!article.datePublished || !article.dateModified || !article.author?.name) {
  throw new Error('TechArticle publication metadata is incomplete');
}
if (!html.includes("'@type': 'FAQPage'")) throw new Error('DOM-derived FAQPage generator is missing');
if (faqCount !== 14) throw new Error(`Expected 14 visible FAQs, found ${faqCount}`);
if (html.includes("'@type': 'HowTo'") || JSON.stringify(blocks).includes('HowTo')) {
  throw new Error('Unsafe HowTo schema is not allowed');
}

console.log(`Valid JSON-LD: TechArticle; DOM-derived FAQPage source with ${faqCount} FAQs`);
