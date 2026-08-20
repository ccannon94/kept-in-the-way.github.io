module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");

  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("./posts/*.{md,markdown}")
      .sort((left, right) => right.date - left.date),
  );

  eleventyConfig.addFilter("longDate", (value) =>
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }).format(new Date(value)),
  );

  eleventyConfig.addFilter("postDate", (value) =>
    new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
      year: "numeric",
    }).format(new Date(value)),
  );

  eleventyConfig.addFilter("excerpt", (html, wordLimit = 30) => {
    const text = String(html)
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    const words = text.split(" ");
    return words.length > wordLimit
      ? `${words.slice(0, wordLimit).join(" ")}…`
      : text;
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
