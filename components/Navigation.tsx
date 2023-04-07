import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs"
import Link from "next/link"

const Navigation = () => {
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
              <SignOutButton>
                <button>Odhlásit se</button>
              </SignOutButton> 
              : 
              <SignInButton>
                <button className="text-5xl">Přihlásit se</button>
              </SignInButton>
            }
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
export default Navigation