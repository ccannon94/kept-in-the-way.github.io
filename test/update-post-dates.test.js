const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const script = path.resolve(".github/scripts/update-post-dates.sh");
const detector = path.resolve(".github/scripts/find-new-posts.sh");

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

test("only a post's first introduction is treated as new", () => {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), "post-move-test-"));

  try {
    execFileSync("git", ["init", "--quiet"], { cwd: repository });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repository });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: repository,
    });
    execFileSync("git", ["config", "commit.gpgsign", "false"], {
      cwd: repository,
    });
    fs.mkdirSync(path.join(repository, "_posts"));

    const oldPath = "_posts/2020-01-01-Sample.md";
    const newPath = "posts/2020-01-01-Sample.md";
    fs.writeFileSync(
      path.join(repository, oldPath),
      [
        "---",
        'title: "Sample"',
        "date: 2020-01-01T00:00:00-05:00",
        "layout: post",
        "---",
        "",
        "Post body.",
        "",
      ].join("\n"),
    );
    execFileSync("git", ["add", "--", oldPath], { cwd: repository });
    execFileSync("git", ["commit", "--quiet", "-m", "add post"], {
      cwd: repository,
    });
    const beforeMigration = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repository,
      encoding: "utf8",
    }).trim();

    fs.mkdirSync(path.join(repository, "posts"));
    fs.renameSync(path.join(repository, oldPath), path.join(repository, newPath));
    const migrated = fs
      .readFileSync(path.join(repository, newPath), "utf8")
      .replace("layout: post\n", "");
    fs.writeFileSync(path.join(repository, newPath), migrated);
    execFileSync("git", ["add", "--", oldPath, newPath], { cwd: repository });
    execFileSync("git", ["commit", "--quiet", "-m", "move post"], {
      cwd: repository,
    });
    const afterMigration = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repository,
      encoding: "utf8",
    }).trim();

    const migratedPosts = execFileSync(
      "bash",
      [detector, beforeMigration, afterMigration],
      { cwd: repository, encoding: "utf8" },
    ).trim();
    assert.equal(migratedPosts, "");

    const firstPath = "posts/2020-01-01-Actually-New.md";
    fs.writeFileSync(
      path.join(repository, firstPath),
      [
        "---",
        'title: "Actually New"',
        "date: 2020-01-01T00:00:00-05:00",
        "---",
        "",
        "New post body.",
        "",
      ].join("\n"),
    );
    execFileSync("git", ["add", "--", firstPath], { cwd: repository });
    execFileSync("git", ["commit", "--quiet", "-m", "add new post"], {
      cwd: repository,
    });
    const afterFirstIntroduction = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repository,
      encoding: "utf8",
    }).trim();

    const firstIntroduction = execFileSync(
      "bash",
      [detector, afterMigration, afterFirstIntroduction],
      { cwd: repository, encoding: "utf8" },
    ).trim();
    assert.equal(firstIntroduction, firstPath);

    execFileSync("git", ["rm", "--quiet", "--", firstPath], { cwd: repository });
    execFileSync("git", ["commit", "--quiet", "-m", "remove post"], {
      cwd: repository,
    });
    const beforeReintroduction = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repository,
      encoding: "utf8",
    }).trim();

    const reintroducedPath = "posts/2021-02-03-Actually-New.md";
    fs.writeFileSync(
      path.join(repository, reintroducedPath),
      [
        "---",
        'title: "Actually New"',
        "date: 2021-02-03T00:00:00-05:00",
        "---",
        "",
        "Reintroduced post body.",
        "",
      ].join("\n"),
    );
    execFileSync("git", ["add", "--", reintroducedPath], { cwd: repository });
    execFileSync("git", ["commit", "--quiet", "-m", "reintroduce post"], {
      cwd: repository,
    });
    const afterReintroduction = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repository,
      encoding: "utf8",
    }).trim();

    const reintroducedPosts = execFileSync(
      "bash",
      [detector, beforeReintroduction, afterReintroduction],
      { cwd: repository, encoding: "utf8" },
    ).trim();

    assert.equal(reintroducedPosts, "");
  } finally {
    fs.rmSync(repository, { force: true, recursive: true });
  }
});
