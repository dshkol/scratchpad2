import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";
export const PROJECTS_PATH = "src/data/projects";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      slug: z.string().optional(),
      categories: z.array(z.string()).default([]),
      codeExpanded: z.boolean().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${PROJECTS_PATH}` }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(["r-package", "analysis", "experiment", "tool"]),
    featured: z.boolean().default(false),
    draft: z.boolean().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    links: z.object({
      github: z.string().url().optional(),
      demo: z.string().url().optional(),
      docs: z.string().url().optional(),
      cran: z.string().url().optional(),
    }).default({}),
  }),
});

export const collections = { blog, projects };
