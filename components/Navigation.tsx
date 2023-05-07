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

const Navigation = () => {
  const { signOut } = useClerk();
  const user = useAuth();
  
  return (
    <NavigationMenu className={cn("mx-auto mt-5", {
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
          <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer", {
            "py-10": !user.isSignedIn,
          })}>
            {user.isSignedIn ? 
              <button onClick={() => signOut()}>Odhlásit se</button>
              : 
              <SignInButton>
                <Button className="text-5xl py-10">Přihlásit se</Button>
              </SignInButton>
            }
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
export default Navigation