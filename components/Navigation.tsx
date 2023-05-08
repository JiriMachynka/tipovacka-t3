import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils";
import { useAuth, SignInButton, useClerk } from "@clerk/nextjs"
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
              <Link href="/tournaments" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Tipovačky
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </>
        }
        <NavigationMenuItem>
          <NavigationMenuLink className={cn(`cursor-pointer ${navigationMenuTriggerStyle()}`, {
            "text-5xl py-10": !user.isSignedIn,
          })}>
            {user.isSignedIn ? 
              <button onClick={() => signOut()}>
                <LogOut />
              </button>
              : 
              <SignInButton>Přihlásit se</SignInButton>
            }
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
export default Navigation