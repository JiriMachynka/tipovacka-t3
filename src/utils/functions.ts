export const getPageName = (pathname: string | undefined) => {
  switch (pathname) {
    case '[id]':
      return 'Tabulka';
    case 'my-tips':
      return 'Moje tipy';
    case 'leaderboard':
      return 'Žebříček';
    case 'manage-matches':
      return 'Správa zápasů';
    case 'manage-scorers':
      return 'Správa střelců';
    case 'manage-players':
      return 'Správa hráčů';
  }
}