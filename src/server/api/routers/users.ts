import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getAllUsers: publicProcedure
    .query(async () => {
      const userList = await clerkClient.users.getUserList();
      return userList;
    }),
  getUser: publicProcedure
    .input(z.object({
      username: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { username } = input;
      const user = await ctx.prisma.player.findFirst({
        where: {
          username
        }
      });
      return user;
    })
});
