import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 900;
const parkButton = (page: Page, name: RegExp) =>
  page.getByRole('list', { name: '12 parks' }).getByRole('button', { name });

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('lists all 12 parks', async ({ page }) => {
  await expect(page.getByRole('list', { name: '12 parks' }).getByRole('button')).toHaveCount(12);
  await expectNoAxeViolations(page);
});

test('keyboard: select a park from the list and go back', async ({ page, browserName }) => {
  // WebKit on macOS skips links on plain Tab by default; Option+Tab reaches every control.
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tab);
  await expect(page.getByRole('link', { name: 'Skip to park list' })).toBeFocused();
  if (isMobile(page)) {
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
  }
  await page.keyboard.press(tab);
  const first = parkButton(page, /Cedar Hill Nature Preserve/);
  await expect(first).toBeFocused();
  await page.keyboard.press('Enter');

  const heading = page.getByRole('heading', { level: 2, name: 'Cedar Hill Nature Preserve' });
  await expect(heading).toBeFocused();
  await expectNoAxeViolations(page);

  await page.keyboard.press(`Shift+${tab}`);
  await expect(page.getByRole('button', { name: /back to all parks/i })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(first).toBeFocused();
});

test('select a park from its map marker', async ({ page }) => {
  if (isMobile(page)) await page.getByRole('button', { name: /^.?\s*Map$/ }).click();
  const marker = page.locator('[data-park-id="highland-dog-park"]');
  await marker.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 2, name: 'Highland Dog Park' })).toBeFocused();
  await expect(page.locator('.park-details')).not.toContainText('Address');
  await page.keyboard.press('Escape');
  await expect(marker).toBeFocused();
  await expect(marker).toHaveClass(/park-pin--selected/);
  if (isMobile(page)) await expectNoAxeViolations(page);
});

test('OSM attribution is visible', async ({ page }) => {
  if (isMobile(page)) await page.getByRole('button', { name: /^.?\s*Map$/ }).click();
  await expect(page.getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();
});

test('images that fail to load are removed', async ({ page }) => {
  await page.route('https://images.example.com/**', (route) => route.abort());
  await parkButton(page, /Prospect Park/).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Prospect Park' })).toBeVisible();
  await expect(page.locator('.park-details img')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Photos' })).toHaveCount(0);
});

test('photos appear once loaded, and the section never shows before then', async ({ page }) => {
  // 1x1 transparent PNG stands in for a working image host.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  );
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route('https://images.example.com/**', async (route) => {
    await gate;
    await route.fulfill({ contentType: 'image/png', body: png });
  });

  await parkButton(page, /Prospect Park/).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Prospect Park' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Photos' })).toBeHidden();

  release();
  await expect(page.getByRole('heading', { name: 'Photos' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Prospect Park, photo/ })).toHaveCount(2);
});

test('layout: side by side on desktop, toggle on mobile', async ({ page }) => {
  const toggle = page.getByRole('group', { name: 'View parks as' });
  const map = page.getByRole('region', { name: /Map of parks/ });
  if (isMobile(page)) {
    await expect(toggle).toBeVisible();
    await expect(map).toBeHidden();
    await toggle.getByRole('button', { name: /Map/ }).click();
    await expect(map).toBeVisible();
    await expect(page.getByRole('list', { name: '12 parks' })).toBeHidden();
  } else {
    await expect(toggle).toHaveCount(0);
    await expect(map).toBeVisible();
    await expect(page.getByRole('list', { name: '12 parks' })).toBeVisible();
  }
});

test('mobile: showing the map again keeps where the user panned', async ({ page }) => {
  test.skip(!isMobile(page), 'mobile toggle only');
  const toggle = page.getByRole('group', { name: 'View parks as' });
  await toggle.getByRole('button', { name: /Map/ }).click();
  await page.locator('[data-park-id="highland-dog-park"]').click();
  await page.getByRole('button', { name: /back to all parks/i }).click();

  const pane = page.locator('.leaflet-map-pane');
  const map = page.getByRole('region', { name: /Map of parks/ });
  const settled = () => expect(page.locator('.leaflet-pan-anim')).toHaveCount(0);
  await settled();
  const before = await pane.getAttribute('style');
  await map.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(pane).not.toHaveAttribute('style', before!);
  await settled();
  const panned = await pane.getAttribute('style');

  await toggle.getByRole('button', { name: /List/ }).click();
  await toggle.getByRole('button', { name: /Map/ }).click();
  await expect(pane).toHaveAttribute('style', panned!);
});

test('reflows at 320px with no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe('reduced motion', () => {
  test('selecting pans without animation', async ({ page }) => {
    test.skip(isMobile(page), 'desktop layout only');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-park-id="hillcrest-skate-park"]').click();
    await expect(page.locator('.leaflet-pan-anim')).toHaveCount(0);
  });
});
