import Navbar from "@/components/Navbar";
import AboutComponent from "@/components/About";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-20">
        <AboutComponent />
      </div>
      <Footer />
    </div>
  );
}
