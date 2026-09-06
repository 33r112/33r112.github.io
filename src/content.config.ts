import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Folder names match what the Writing page calls these: long-form
// entries are Posts, short ones are Thoughts, both under writing/.
// Files are named date-first (YYYY-MM-DD-slug) so a directory listing
// reads in the same order the page does.
const posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/writing/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(["game-design", "development", "media", "misc"]),
    description: z.string(),
    avatar: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()),
  }),
});

const thoughts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/writing/thoughts" }),
  schema: z.object({
    date: z.coerce.date(),
    // optional, unlike a full article's — a Micro entry is still valid
    // without one, and older entries were written before this existed
    avatar: z.string().optional(),
  }),
});

// One folder per review, named "YYYY-MM-DD 游戏名" — the dates are
// unique so that alone sorts and identifies them, and the title being
// right there makes the directory readable. These never get their own
// URL (they expand in place on the Reviews page), so a non-ASCII id
// costs nothing. status is the three-step progression only; how a run
// actually ended (真结局, 全图鉴, 二周目) stays in the body text.
const reviews = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/reviews/games" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // the game's own release year, not when it was played — left out
      // until it's filled in by hand, since it isn't in the write-ups
      year: z.number().optional(),
      date: z.coerce.date(),
      hours: z.number(),
      // not in the original write-ups either — empty until filled in
      platform: z.string().default(""),
      // the heart beside the title — not a score, just whether it stuck
      liked: z.boolean().default(false),
      status: z.enum(["正在游玩", "通关", "白金"]),
      cover: image(),
    }),
});

// Same one-folder-per-entry shape as reviews/games, but the fields swap
// out for what actually applies to a comic/anime run: "year" holds the
// serialization span (a string like "2003~2018", not a single number),
// "medium" replaces platform (comic / anime / manga / webtoon...), and
// "issue" replaces hours as the chapter/episode count.
const animeManga = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/reviews/anime-manga" }),
  schema: ({ image }) =>
    z.object({
      // the work's own title, in its original language — shown in the
      // expanded detail panel
      title: z.string(),
      // a Chinese title, shown on the collapsed grid card instead;
      // falls back to title itself when there isn't a separate one
      titleZh: z.string().optional(),
      year: z.string().optional(),
      date: z.coerce.date(),
      medium: z.string().default(""),
      issue: z.number(),
      // not in the raw write-ups — empty until filled in, same as
      // reviews/games' platform started out
      author: z.string().default(""),
      liked: z.boolean().default(false),
      cover: image(),
    }),
});

export const collections = { posts, projects, reviews, thoughts, animeManga };
