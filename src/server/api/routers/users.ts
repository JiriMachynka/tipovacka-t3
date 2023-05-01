import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getAllUsers: publicProcedure
    .query(async () => {
      const userList = await clerkClient.users.getUserList();
      return userList;
    }),
});
