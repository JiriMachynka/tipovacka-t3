import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils";
import { useAuth, useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

const Navigation = () => {
  const { signOut } = useClerk();
  const user = useAuth();

  return (
    <NavigationMenu className={cn("mx-auto my-4", {
      "my-auto": !user.isSignedIn,
    })}>
      <NavigationMenuList>
        {user.isSignedIn &&
          <>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Tipovačky
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </>
        }
        <NavigationMenuItem>
          {user.isSignedIn ? 
            <Button onClick={() => signOut()}>
              <LogOut />
            </Button>
            : 
            <Link className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-50 dark:focus:ring-slate-400 disabled:pointer-events-none dark:focus:ring-offset-slate-900 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800 bg-slate-900 text-white hover:bg-slate-100 hover:text-slate-800 dark:bg-slate-50 dark:text-slate-900 p-5 text-5xl" href="/sign-in">Přihlásit se</Link>
          }
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
export default Navigation