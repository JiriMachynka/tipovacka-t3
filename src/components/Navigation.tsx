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
import { Button, buttonVariants } from "./ui/button";
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
              <NavigationMenuLink href="/" className={navigationMenuTriggerStyle()}>
                Tipovačky
              </NavigationMenuLink>
            </NavigationMenuItem>
          </>
        }
        <NavigationMenuItem>
          {user.isSignedIn ? 
            <Button onClick={() => signOut()}>
              <LogOut />
            </Button>
            : 
            <Link 
              className={cn(buttonVariants({ size: "default" }), "text-5xl p-5")} 
              href="/sign-in"
            >
              Přihlásit se
            </Link>
          }
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
export default Navigation