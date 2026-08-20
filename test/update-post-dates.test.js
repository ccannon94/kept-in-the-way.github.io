const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const script = path.resolve(".github/scripts/update-post-dates.sh");

test("the date action renames and stamps a new Eleventy post", () => {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), "post-date-test-"));

  try {
    execFileSync("git", ["init", "--quiet"], { cwd: repository });
    fs.mkdirSync(path.join(repository, "posts"));

    const original = "posts/2020-01-01-Sample.md";
    fs.writeFileSync(
      path.join(repository, original),
      [
        "---",
        'title: "Sample"',
        "date: 2020-01-01T00:00:00-05:00",
        "---",
        "",
        "Post body.",
        "",
      ].join("\n"),
    );
    execFileSync("git", ["add", "--", original], { cwd: repository });

    execFileSync("bash", [script, original], {
      cwd: repository,
      env: {
        ...process.env,
        POST_DATE: "2026-08-20",
        POST_DATETIME: "2026-08-20 14:15:16 -0400",
      },
    });

    const renamed = path.join(repository, "posts/2026-08-20-Sample.md");
    assert.equal(fs.existsSync(path.join(repository, original)), false);
    assert.equal(fs.existsSync(renamed), true);
    assert.match(
      fs.readFileSync(renamed, "utf8"),
      /^date: 2026-08-20T14:15:16-04:00$/m,
    );
  } finally {
    fs.rmSync(repository, { force: true, recursive: true });
  }
});
