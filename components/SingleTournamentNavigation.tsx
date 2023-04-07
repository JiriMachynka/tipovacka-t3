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
import { useRouter } from "next/router";

const SingleTournamentNavigation = () => {
  const router = useRouter();
  const user = useAuth();
  
  return (
    <NavigationMenu className={cn({
      "my-auto": !user.isSignedIn,
    })}>
      <NavigationMenuList>
        {user.isSignedIn &&
          <>
            <NavigationMenuItem>
              <Link href="/tournaments" legacyBehavior passHref >
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Zpět na tipovačky
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href={`/tournaments/${router.query.id as string}`} legacyBehavior passHref >
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Tabulka
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href={`/tournaments/${router.query.id as string}/my-tips`} legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Moje tipy
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href={`/tournaments/${router.query.id as string}/manage-matches`} legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Spravovat zápasy
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
                <button className="uppercase" onClick={() => router.push("/")}>Odhlásit se</button>
              </SignOutButton> 
              : 
              <SignInButton>
                <button className="text-5xl uppercase">Přihlásit se</button>
              </SignInButton>
            }
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
export default SingleTournamentNavigation