function pad(value) {
  return String(value).padStart(2, "0");
}

module.exports = {
  layout: "layouts/post.njk",
  eleventyComputed: {
    permalink(data) {
      const date = new Date(data.date);
      const slug = data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
      return `/${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(
        date.getUTCDate(),
      )}/${slug}.html`;
    },
  },
};
