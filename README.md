# Kept in the Way

The Kept in the Way blog is built with [Eleventy](https://www.11ty.dev/) and deployed to Cloudflare Pages.

## Local development

```sh
npm install
npm start
```

Create posts in `posts/` with YAML front matter containing `title`, `date`, and optional content tags. The filename should start with `YYYY-MM-DD-`; the GitHub action updates that prefix and the front-matter date when a new post reaches `main`.

## Production build

```sh
npm ci
npm run build
```

Eleventy writes the deployable site to `_site/`. Cloudflare Pages uses `npm run build` as its build command and `_site` as its output directory.
