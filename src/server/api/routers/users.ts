import { Users } from "@/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await clerkClient.users.getUser(ctx.userId);

      const currentUser = await ctx.db
        .select({ email: Users.email })
        .from(Users)
        .where(eq(Users.id, ctx.userId));

      if (!currentUser[0]?.email) {
        await ctx.db
          .insert(Users)
          .values({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            username: user.username,
          })
      }
      return null;
    }),
  getAllUsers: publicProcedure
    .query(async () => {
      const userList = await clerkClient.users.getUserList();
      return userList;
    }),
});
