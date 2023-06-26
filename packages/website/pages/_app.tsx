import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Automate your business with activepieces</title>
      </Head>
      <main className="app w-full min-h-full p-0 m-0">
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default CustomApp;
