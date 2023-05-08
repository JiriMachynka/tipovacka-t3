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
  const { signOut, openSignIn } = useClerk();
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
          {user.isSignedIn ? 
            <Button onClick={() => signOut()}>
              <LogOut />
            </Button>
            : 
            <Button type="button" className="py-10 text-5xl" onClick={() => openSignIn()}>Přihlásit se</Button>
          }
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
export default Navigation