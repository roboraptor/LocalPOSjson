import '../styles/globals.css'; // 👈 sem patří import globálního CSS
import Header from '../components/Header';

export default function App({ Component, pageProps }) {
return (
    <div className="app">
      <Header className="site-header" />
      <main className="site-main">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
