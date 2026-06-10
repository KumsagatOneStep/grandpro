import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto('http://localhost:3000/ru', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/gp-hero.png' });
console.log('hero');

await page.evaluate(() => document.getElementById('services')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/gp-services.png' });
console.log('services');

await page.evaluate(() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/gp-calc.png' });
console.log('calc');

await page.evaluate(() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/gp-reviews.png' });
console.log('reviews');

await page.evaluate(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/gp-contact.png' });
console.log('contact');

await browser.close();
