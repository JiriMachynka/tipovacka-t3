import { clerkClient } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await clerkClient.users.getUser(ctx.userId);

      await ctx.db.execute(sql`
        INSERT INTO users (id, email, username)
        VALUES (${user.id}, ${user.emailAddresses[0]?.emailAddress}, ${user.username})
        ON CONFLICT (id) DO NOTHING;
      `);
      // TODO: This was giving some weird error, so I commented it out for now.
      // await ctx.db
      //   .insert(Users)
      //   .values({
      //     id: user.id,
      //     email: user.emailAddresses[0]?.emailAddress,
      //     username: user.username,
      //   });
    }),
  getAllUsers: publicProcedure
    .query(async () => {
      const userList = await clerkClient.users.getUserList();
      return userList;
    }),
});
