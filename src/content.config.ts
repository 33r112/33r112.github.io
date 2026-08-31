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

export const collections = { posts, projects, thoughts };
