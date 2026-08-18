import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(/[A-Z]/, "Password needs an uppercase letter")
    .regex(/[a-z]/, "Password needs a lowercase letter")
    .regex(/[0-9]/, "Password needs a number"),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(15)
    .default([]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,40}$/),
  headline: z.string().trim().max(120).optional().default(""),
  bio: z.string().trim().max(800).optional().default(""),
  location: z.string().trim().max(100).optional().default(""),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  githubUsername: z.string().trim().max(80).optional().default(""),
  linkedinUrl: optionalUrl,
  image: optionalUrl,
});

export const certificationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  issuer: z.string().trim().min(2).max(120),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "EXPIRED"]).default("PLANNED"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  credentialUrl: optionalUrl.nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const portfolioProjectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1500),
  technologies: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  imageUrl: optionalUrl,
  featured: z.boolean().default(false),
});

export const applicationSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]),
  appliedAt: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const goalSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().default(""),
  partnerId: z.string().uuid().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).default("ACTIVE"),
});

export const messageSchema = z.object({
  receiverId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export const teamSchema = z.object({
  hackathonId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().default(""),
  repositoryUrl: optionalUrl,
});
