import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { HackathonBrowser } from "@/components/hackathon-browser";
export default async function HackathonsPage(){const session=await auth();if(!session?.user?.id)redirect('/login');const rows=await prisma.hackathon.findMany({include:{participants:{where:{userId:session.user.id},select:{id:true}},_count:{select:{participants:true,teams:true}}},orderBy:{startDate:'asc'}});const initial=rows.map(h=>({id:h.id,name:h.name,description:h.description,location:h.location,mode:h.mode,startDate:h.startDate.toISOString(),endDate:h.endDate.toISOString(),registrationDeadline:h.registrationDeadline?.toISOString()||null,websiteUrl:h.websiteUrl,technologies:h.technologies,joined:h.participants.length>0,participants:h._count.participants,teams:h._count.teams}));return <><PageHeader title="Hackathon browser" description="Join practical events, build evidence and form a small project team."/><HackathonBrowser initial={initial}/></>}
