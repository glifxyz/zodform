import 'nextra-theme-docs/style.css';

import type { Metadata } from 'next';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';

export const metadata: Metadata = {
  title: '%s - ZodForm'
};

const navbar: React.ReactNode = (
  <Navbar
    logo={<span style={{ fontWeight: 'bold' }}>ZodForm</span>}
    projectLink="https://github.com/nkalpak/zodform"
  />
);
const footer: React.ReactNode = (
  <Footer>
    MIT {new Date().getFullYear()} ©{' '}
    <a href="https://github.com/nkalpak/zodform" target="_blank">
      ZodForm
    </a>
    .
  </Footer>
);

export default async function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head backgroundColor={{ dark: '#0f172a', light: '#fefce8' }} />
      <body>
        <Layout
          docsRepositoryBase="https://github.com/nkalpak/zodform"
          editLink={false}
          pageMap={await getPageMap()}
          navbar={navbar}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
