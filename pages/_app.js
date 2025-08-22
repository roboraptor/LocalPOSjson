import '../styles/globals.css'; // 👈 sem patří import globálního CSS
import Header from '../components/Header';

export default function App({ Component, pageProps }) {
  return (
    <>
        <Header />
        <Component {...pageProps} />
    </>
  );
}
