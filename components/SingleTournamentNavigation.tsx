import {
  ListItem,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/router";
import { api } from "~/utils/api";

const SingleTournamentNavigation = () => {
  const router = useRouter();
  const user = useAuth();
  const { data: tournamentData } = api.tournament.getAllTournamentData.useQuery({ tournamentId: parseInt(router.query.id as string) });

  if (!tournamentData) return null;

  return (
    <>
      <NavigationMenu className={cn({
        "my-auto": !user.isSignedIn,
      })}>
        <NavigationMenuList>
          {user.isSignedIn &&
            <>
              <NavigationMenuItem className="hidden lg:block">
                <Link href="/tournaments" legacyBehavior passHref >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Zpět na tipovačky
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className="hidden lg:block">
                <Link href={`/tournaments/${router.query.id as string}`} legacyBehavior passHref >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Tabulka
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className="hidden lg:block">
                <Link href={`/tournaments/${router.query.id as string}/my-tips`} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Moje tipy
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {(tournamentData?.authorId === user.userId) && (<>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Admin sekce</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="flex flex-col w-[300px] bg-[#11132b]">
                      <ListItem className="border-b border-b-slate-50 !rounded-none" href={`/tournaments/${router.query.id as string}/manage-matches`} title="Spravovat zápasy" />
                      <ListItem className="border-b border-b-slate-50 !rounded-none" href={`/tournaments/${router.query.id as string}/manage-scorers`} title="Spravovat zápasy" />
                      <ListItem href={`/tournaments/${router.query.id as string}/manage-players`} title="Spravovat hráče" />
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </>)}
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
    </>
  )
}

export default SingleTournamentNavigation;