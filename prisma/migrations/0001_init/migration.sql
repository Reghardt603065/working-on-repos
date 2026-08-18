-- GradConnect initial PostgreSQL schema
CREATE TYPE "UserRole" AS ENUM ('GRADUATE', 'ADMIN');
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "CertificationStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');
CREATE TYPE "PeerLinkStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');
CREATE TYPE "PeerRelationship" AS ENUM ('PEER', 'MENTOR', 'MENTEE');
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
CREATE TYPE "TeamMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'DECLINED', 'LEFT');
CREATE TYPE "NotificationType" AS ENUM ('JOB', 'APPLICATION', 'CERTIFICATION', 'HACKATHON', 'PEER', 'MESSAGE', 'SYSTEM');
CREATE TYPE "ActivityType" AS ENUM ('PROFILE_UPDATED', 'JOB_SAVED', 'JOB_APPLIED', 'CERTIFICATION_ADDED', 'CERTIFICATION_COMPLETED', 'HACKATHON_JOINED', 'PROJECT_ADDED', 'GITHUB_SYNCED', 'GOAL_UPDATED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "image" TEXT,
  "username" TEXT NOT NULL,
  "headline" TEXT,
  "bio" TEXT,
  "location" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "githubUsername" TEXT,
  "linkedinUrl" TEXT,
  "consentAcceptedAt" TIMESTAMP(3),
  "role" "UserRole" NOT NULL DEFAULT 'GRADUATE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobListing" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT,
  "jobType" TEXT,
  "experienceLevel" TEXT,
  "category" TEXT,
  "salaryMin" INTEGER,
  "salaryMax" INTEGER,
  "currency" TEXT,
  "applyUrl" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "remote" BOOLEAN NOT NULL DEFAULT false,
  "postedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedJob" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  "appliedAt" TIMESTAMP(3),
  "deadline" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Certification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "status" "CertificationStatus" NOT NULL DEFAULT 'PLANNED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "issueDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "credentialUrl" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Hackathon" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT,
  "mode" TEXT NOT NULL DEFAULT 'ONLINE',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "registrationDeadline" TIMESTAMP(3),
  "websiteUrl" TEXT,
  "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "source" TEXT NOT NULL DEFAULT 'GradConnect',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HackathonParticipant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "hackathonId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HackathonParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "hackathonId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "repositoryUrl" TEXT,
  "workspaceData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMember" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'Member',
  "status" "TeamMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerLink" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "addresseeId" TEXT NOT NULL,
  "status" "PeerLinkStatus" NOT NULL DEFAULT 'PENDING',
  "relationship" "PeerRelationship" NOT NULL DEFAULT 'PEER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PeerLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Goal" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "partnerId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "targetDate" TIMESTAMP(3),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioProject" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "githubUrl" TEXT,
  "liveUrl" TEXT,
  "imageUrl" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "newJobs" BOOLEAN NOT NULL DEFAULT true,
  "applicationReminders" BOOLEAN NOT NULL DEFAULT true,
  "certificationReminders" BOOLEAN NOT NULL DEFAULT true,
  "peerUpdates" BOOLEAN NOT NULL DEFAULT true,
  "hackathonReminders" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobFetchLog" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "fetched" INTEGER NOT NULL DEFAULT 0,
  "inserted" INTEGER NOT NULL DEFAULT 0,
  "updated" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "JobFetchLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "JobListing_source_externalId_key" ON "JobListing"("source", "externalId");
CREATE INDEX "JobListing_title_idx" ON "JobListing"("title");
CREATE INDEX "JobListing_company_idx" ON "JobListing"("company");
CREATE INDEX "JobListing_location_idx" ON "JobListing"("location");
CREATE INDEX "JobListing_postedAt_idx" ON "JobListing"("postedAt");
CREATE INDEX "JobListing_remote_idx" ON "JobListing"("remote");
CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");
CREATE INDEX "SavedJob_userId_idx" ON "SavedJob"("userId");
CREATE UNIQUE INDEX "JobApplication_userId_jobId_key" ON "JobApplication"("userId", "jobId");
CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication"("userId", "status");
CREATE INDEX "Certification_userId_status_idx" ON "Certification"("userId", "status");
CREATE INDEX "Certification_expiryDate_idx" ON "Certification"("expiryDate");
CREATE INDEX "Hackathon_startDate_idx" ON "Hackathon"("startDate");
CREATE UNIQUE INDEX "HackathonParticipant_userId_hackathonId_key" ON "HackathonParticipant"("userId", "hackathonId");
CREATE INDEX "HackathonParticipant_hackathonId_idx" ON "HackathonParticipant"("hackathonId");
CREATE UNIQUE INDEX "Team_hackathonId_name_key" ON "Team"("hackathonId", "name");
CREATE INDEX "Team_createdById_idx" ON "Team"("createdById");
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE UNIQUE INDEX "PeerLink_requesterId_addresseeId_key" ON "PeerLink"("requesterId", "addresseeId");
CREATE INDEX "PeerLink_addresseeId_status_idx" ON "PeerLink"("addresseeId", "status");
CREATE INDEX "Goal_ownerId_status_idx" ON "Goal"("ownerId", "status");
CREATE INDEX "Goal_partnerId_idx" ON "Goal"("partnerId");
CREATE UNIQUE INDEX "PortfolioProject_userId_slug_key" ON "PortfolioProject"("userId", "slug");
CREATE INDEX "PortfolioProject_userId_featured_idx" ON "PortfolioProject"("userId", "featured");
CREATE INDEX "Message_senderId_receiverId_createdAt_idx" ON "Message"("senderId", "receiverId", "createdAt");
CREATE INDEX "Message_receiverId_readAt_idx" ON "Message"("receiverId", "readAt");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");
CREATE INDEX "JobFetchLog_source_startedAt_idx" ON "JobFetchLog"("source", "startedAt");

ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HackathonParticipant" ADD CONSTRAINT "HackathonParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HackathonParticipant" ADD CONSTRAINT "HackathonParticipant_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerLink" ADD CONSTRAINT "PeerLink_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerLink" ADD CONSTRAINT "PeerLink_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
