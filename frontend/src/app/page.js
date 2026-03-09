import HomePage from '../components/HomePage';
import Navbar from '../components/Navbar';
import PageLoader from '../components/PageLoader';

export default function Page() {
  return (
    <main className="vignette">
      <PageLoader />
      <Navbar />
      <HomePage />
    </main>
  );
}
