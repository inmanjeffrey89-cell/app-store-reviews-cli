import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cli } from './cli.mjs';
import { parseAppId } from '../src/appstore.js';

test('a slug containing "id<digits>" is not mistaken for the app id', () => {
  assert.equal(parseAppId('https://apps.apple.com/us/app/covid19-tracker/id1520427663'), '1520427663');
  assert.equal(parseAppId('https://apps.apple.com/us/app/squid9-game/id123'), '123');
  assert.equal(parseAppId('https://itunes.apple.com/app/id310633997?mt=8'), '310633997');
  assert.equal(parseAppId('covid19-tracker'), null);
});

test('Apple rejecting the country is invalid input (exit 1), not a retryable network error', () => {
  const r = cli(['310633997', 'zz', '--json'], { preload: 'apple-400' });
  assert.equal(r.status, 1, r.stderr);
  const e = JSON.parse(r.stderr).error;
  assert.equal(e.type, 'INVALID_REQUEST');
  assert.equal(e.retryable, false);
});

test('an HTML page instead of the feed is an upstream failure (exit 2), not "no reviews"', () => {
  const r = cli(['310633997', '--json'], { preload: 'apple-html' });
  assert.equal(r.status, 2, r.stderr);
  assert.equal(JSON.parse(r.stderr).error.type, 'BAD_RESPONSE');
});

test('a later page failing with 404 is a partial run: exit 2, not 3', () => {
  const r = cli(['310633997', 'us', '200', '--json'], { preload: 'apple-page2-404' });
  assert.equal(r.status, 2, r.stderr);
  const env = JSON.parse(r.stdout);
  assert.equal(env.complete, false);
  assert.equal(env.count, 50);
  assert.equal(JSON.parse(r.stderr).exitCode, 2);
});

test('the storefront in the link is used unless a country is given', () => {
  const link = 'https://apps.apple.com/gb/app/whatsapp-messenger/id310633997';
  const fromLink = JSON.parse(cli([link, '--json'], { preload: 'apple-record-url' }).stdout);
  assert.equal(fromLink.input.country, 'gb');
  assert.match(fromLink.results[0].title, /itunes\.apple\.com\/gb\//);
  const explicit = JSON.parse(cli([link, 'us', '--json'], { preload: 'apple-record-url' }).stdout);
  assert.equal(explicit.input.country, 'us');
});
