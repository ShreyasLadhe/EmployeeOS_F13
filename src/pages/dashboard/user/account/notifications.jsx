import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { AccountNotificationsView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = {
  title: `Account notifications settings | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AccountNotificationsView />
    </>
  );
}
