const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

test("Testing the header text", async () => {
  const text = await page.getContentOf("a.brand-logo");

  expect(text).toEqual("Blogster");
});

test("Testing the oauth flow", async () => {
  await page.click(".right a");

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test("When signed in, shows logout button", async () => {
  await page.login();

  const txt = await page.getContentOf('a[href="/auth/logout"]');

  expect(txt).toEqual("Logout");
});
